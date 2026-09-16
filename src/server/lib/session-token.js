import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Token de sessão do painel: JSON assinado com HMAC-SHA256.
 *
 * A sessão é stateless de propósito — uma implantação pequena não precisa de
 * tabela de sessões nem de Redis para validar cada requisição. O preço é que um
 * token só perde validade quando expira: `POST /api/auth/logout` apaga o cookie
 * do navegador, mas não revoga um token já copiado. Se alguma implantação
 * precisar de revogação imediata, este é o ponto de troca por sessão
 * persistida — nenhum chamador conhece o formato do token.
 *
 * Não é JWT: o formato é interno, não há negociação de algoritmo pelo token
 * (`alg: none` e afins não existem aqui) e o único algoritmo aceito é o fixado
 * neste módulo.
 */

const SEPARATOR = '.';
const MIN_SECRET_LENGTH = 32;

/** 12h: cobre um dia de trabalho sem deixar sessão aberta indefinidamente. */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

/**
 * Segredo de assinatura da implantação.
 *
 * Resolvido a cada chamada (não no import) para o build não exigir a variável
 * e para os testes poderem trocá-la. Ausência é erro de configuração, não de
 * requisição: derrubar com mensagem explícita é melhor que assinar com um
 * padrão previsível.
 */
function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET ausente ou curto demais (mínimo ${MIN_SECRET_LENGTH} caracteres). ` +
        'Gere um com `openssl rand -base64 48` e preencha o .env desta implantação.',
    );
  }

  return secret;
}

function sign(encodedPayload) {
  return createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('base64url');
}

/**
 * Cria um token para o usuário autenticado.
 *
 * Só entra no token o que o painel precisa para renderizar sem ir ao banco em
 * toda navegação. Nada sensível: o conteúdo é assinado, não cifrado.
 */
export function createSessionToken(
  { userId, companyId, role, name },
  { ttlSeconds = SESSION_TTL_SECONDS, now = Date.now() } = {},
) {
  if (!userId || !companyId) {
    throw new Error('Sessão exige userId e companyId.');
  }

  const issuedAt = Math.floor(now / 1000);
  const payload = {
    sub: userId,
    cid: companyId,
    role,
    name,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}${SEPARATOR}${sign(encoded)}`;
}

/**
 * Valida um token e devolve a sessão, ou `null` se o token for inválido,
 * adulterado ou expirado. A assinatura é conferida antes de o payload ser
 * interpretado, para nunca haver decisão baseada em conteúdo não verificado.
 */
export function verifySessionToken(token, { now = Date.now() } = {}) {
  if (typeof token !== 'string' || token.length === 0) return null;

  const parts = token.split(SEPARATOR);
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded), 'base64url');
  const received = Buffer.from(signature, 'base64url');
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.sub !== 'string' || typeof payload.cid !== 'string') {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return null;

  return {
    userId: payload.sub,
    companyId: payload.cid,
    role: typeof payload.role === 'string' ? payload.role : null,
    name: typeof payload.name === 'string' ? payload.name : null,
    expiresAt: new Date(payload.exp * 1000),
  };
}
