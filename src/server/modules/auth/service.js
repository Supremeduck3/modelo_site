import { validateLoginInput } from '@/lib/auth/schema';
import { prisma } from '@/server/db/client';
import { verifyPassword } from '@/server/lib/password';
import { consumeRateLimit } from '@/server/lib/rate-limit';
import { createSessionToken } from '@/server/lib/session-token';
import { getCurrentCompany } from '@/server/modules/company/service';

/** Erro de autenticação com código estável, para a rota traduzir em HTTP. */
export class AuthError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Hash de uma senha aleatória descartada, conferido quando o e-mail não existe.
 *
 * Sem isso, "e-mail inexistente" responderia na hora e "senha errada" levaria o
 * tempo do scrypt — a diferença diria a quem tenta quais e-mails são reais.
 * Gastar o mesmo trabalho nos dois caminhos remove esse canal.
 */
const DECOY_HASH =
  'scrypt$32768$8$1$vjRmKnXpYXAPqydvVf5QXA$qYw_7CPGXqt8RFOfiKthYDe3IWfXF2_qHobztW4RwTy_OtRDs6Ka0U-u1h9U94rBL5nuVSVr_BplhgC8PHd1QA';

/**
 * Tentativas por janela.
 *
 * Duas cotas: uma por cliente, contra quem varre senhas de vários e-mails, e
 * uma por e-mail, contra quem varre o mesmo e-mail de vários endereços.
 */
const RATE_LIMIT_BY_CLIENT = { limit: 10, windowMs: 10 * 60 * 1000 };
const RATE_LIMIT_BY_EMAIL = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Mensagem única para credencial errada, e-mail inexistente ou conta inativa. */
const GENERIC_FAILURE = 'E-mail ou senha incorretos.';

/**
 * Autentica um usuário do painel e devolve { token, user }.
 *
 * Lança `AuthError` em qualquer falha. A rota não diferencia os motivos para o
 * visitante: distinguir "não existe" de "senha errada" entrega metade da
 * credencial a quem está tentando.
 */
export async function authenticate(
  rawInput,
  { clientId = 'desconhecido' } = {},
) {
  const { success, data, errors } = validateLoginInput(rawInput);

  if (!success) {
    throw new AuthError('validation_error', 'Dados inválidos.', errors);
  }

  // A cota por cliente é consumida antes da do e-mail: assim quem varre vários
  // e-mails do mesmo lugar é barrado sem gastar a cota de contas alheias.
  const byClient = consumeRateLimit(
    `login:ip:${clientId}`,
    RATE_LIMIT_BY_CLIENT,
  );
  if (!byClient.allowed) {
    throw new AuthError(
      'rate_limited',
      'Muitas tentativas de acesso. Aguarde alguns minutos.',
      { retryAfterSeconds: byClient.retryAfterSeconds },
    );
  }

  const byEmail = consumeRateLimit(
    `login:email:${data.email}`,
    RATE_LIMIT_BY_EMAIL,
  );
  if (!byEmail.allowed) {
    throw new AuthError(
      'rate_limited',
      'Muitas tentativas para esta conta. Aguarde alguns minutos.',
      { retryAfterSeconds: byEmail.retryAfterSeconds },
    );
  }

  const company = await getCurrentCompany();

  const user = await prisma.companyUser.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      companyId: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  // Usuário de outra empresa não deveria existir nesta base, mas o vínculo é
  // conferido de todo modo: a sessão carrega o companyId e tudo no painel
  // filtra por ele.
  const isUsable = Boolean(user) && user.companyId === company.id;

  // `passwordHash` é nulo enquanto um convite não foi aceito. O decoy cobre
  // esse caso junto com o de e-mail inexistente: sem ele, a conta convidada
  // responderia mais rápido e o tempo diria que ela existe.
  const passwordMatches = await verifyPassword(
    data.password,
    (isUsable && user.passwordHash) || DECOY_HASH,
  );

  if (!isUsable || !passwordMatches || !user.isActive) {
    throw new AuthError('invalid_credentials', GENERIC_FAILURE);
  }

  await prisma.companyUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    name: user.name,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Carrega o usuário de uma sessão válida, confirmando no banco que ele continua
 * ativo e vinculado à empresa desta implantação.
 *
 * O token é assinado mas stateless: sem esta conferência, desativar um usuário
 * ou trocar a senha dele só teria efeito quando a sessão expirasse. Devolve
 * `null` quando a sessão não serve mais.
 */
export async function loadSessionUser(session) {
  if (!session?.userId) return null;

  const user = await prisma.companyUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      companyId: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordChangedAt: true,
    },
  });

  if (!user?.isActive) return null;

  // Token emitido antes da última troca de senha não vale mais: é assim que
  // redefinir a senha derruba as sessões abertas com a senha antiga.
  //
  // A comparação é em segundos porque é essa a resolução do `iat`. Comparar em
  // milissegundos invalidaria o token de quem entra no mesmo segundo em que a
  // senha foi trocada — justamente o login logo depois de redefinir —, e o
  // usuário ficaria preso num laço de login. O preço é uma janela de até um
  // segundo em que um token antigo ainda passa.
  if (user.passwordChangedAt) {
    const issuedAtSeconds = session.issuedAt
      ? Math.floor(session.issuedAt.getTime() / 1000)
      : null;
    const changedAtSeconds = Math.floor(
      user.passwordChangedAt.getTime() / 1000,
    );

    if (issuedAtSeconds === null || issuedAtSeconds < changedAtSeconds) {
      return null;
    }
  }
  // Token emitido para outra empresa (base restaurada, segredo reaproveitado)
  // não vale nesta implantação.
  if (user.companyId !== session.companyId) return null;

  const company = await getCurrentCompany();
  if (user.companyId !== company.id) return null;

  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
