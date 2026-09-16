import {
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from '@/lib/auth/schema';
import { prisma } from '@/server/db/client';
import { hashPassword, PasswordPolicyError } from '@/server/lib/password';
import { consumeRateLimit } from '@/server/lib/rate-limit';
import { generateResetToken, hashResetToken } from '@/server/lib/reset-token';
import { getCurrentCompany } from '@/server/modules/company/service';
import { AuthError } from './service';

/**
 * Recuperação de senha do painel.
 *
 * Duas regras atravessam o módulo inteiro:
 *
 * 1. **O pedido responde igual em todos os casos.** Existir ou não a conta,
 *    estar ativa ou não, a rota devolve a mesma mensagem — senão o formulário
 *    viraria um verificador de quais e-mails têm acesso ao painel.
 * 2. **O link vale uma vez e expira.** O token é gravado só como hash, é
 *    marcado como usado dentro da mesma transação que troca a senha, e um
 *    pedido novo invalida os anteriores.
 */

/** Uma hora: tempo de sobra para abrir o e-mail, curto para um link vazado. */
export const RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Cotas do pedido.
 *
 * Como no login, duas: por cliente, contra quem varre endereços; por e-mail,
 * para que ninguém possa encher a caixa de outra pessoa pedindo link em série.
 */
const RATE_LIMIT_BY_CLIENT = { limit: 5, windowMs: 30 * 60 * 1000 };
const RATE_LIMIT_BY_EMAIL = { limit: 3, windowMs: 30 * 60 * 1000 };

/** Cota da confirmação: limita quem tenta adivinhar token. */
const RATE_LIMIT_CONFIRM = { limit: 10, windowMs: 30 * 60 * 1000 };

const INVALID_TOKEN_MESSAGE =
  'Este link de recuperação não é mais válido. Peça um novo para continuar.';

/**
 * Registra um pedido de recuperação.
 *
 * Devolve `{ token, user }` quando há alguém para notificar e `{ token: null }`
 * quando não há. Quem chama não deve variar a resposta HTTP com base nisso: o
 * retorno existe só para a camada de e-mail saber se tem o que enviar.
 */
export async function requestPasswordReset(
  rawInput,
  { clientId = 'desconhecido' } = {},
) {
  const { success, data, errors } = validateForgotPasswordInput(rawInput);
  if (!success) {
    throw new AuthError('validation_error', 'Dados inválidos.', errors);
  }

  const byClient = consumeRateLimit(
    `reset:ip:${clientId}`,
    RATE_LIMIT_BY_CLIENT,
  );
  if (!byClient.allowed) {
    throw new AuthError(
      'rate_limited',
      'Muitos pedidos de recuperação. Aguarde alguns minutos.',
      { retryAfterSeconds: byClient.retryAfterSeconds },
    );
  }

  const byEmail = consumeRateLimit(
    `reset:email:${data.email}`,
    RATE_LIMIT_BY_EMAIL,
  );
  if (!byEmail.allowed) {
    // Mesma mensagem da cota por cliente: dizer "esta conta" revelaria que ela
    // existe.
    throw new AuthError(
      'rate_limited',
      'Muitos pedidos de recuperação. Aguarde alguns minutos.',
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
      isActive: true,
    },
  });

  // Conta inexistente, inativa ou de outra empresa: sem token, mas quem chama
  // responde a mesma coisa.
  if (!user?.isActive || user.companyId !== company.id) {
    return { token: null, user: null };
  }

  const token = generateResetToken();

  await prisma.$transaction([
    // Um pedido novo invalida os anteriores: só o último link funciona, então
    // um link antigo que tenha vazado deixa de servir.
    prisma.passwordReset.updateMany({
      where: { companyUserId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordReset.create({
      data: {
        companyUserId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    }),
  ]);

  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

/**
 * Conclui a recuperação com o token do link.
 *
 * Troca a senha e marca o token como usado na mesma transação: dois cliques
 * simultâneos no mesmo link não redefinem duas vezes. `passwordChangedAt`
 * derruba as sessões abertas com a senha antiga.
 */
export async function confirmPasswordReset(
  rawInput,
  { clientId = 'desconhecido' } = {},
) {
  const { success, data, errors } = validateResetPasswordInput(rawInput);
  if (!success) {
    throw new AuthError('validation_error', 'Dados inválidos.', errors);
  }

  const rate = consumeRateLimit(
    `reset-confirm:${clientId}`,
    RATE_LIMIT_CONFIRM,
  );
  if (!rate.allowed) {
    throw new AuthError(
      'rate_limited',
      'Muitas tentativas. Aguarde alguns minutos.',
      { retryAfterSeconds: rate.retryAfterSeconds },
    );
  }

  const reset = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashResetToken(data.token) },
    select: {
      id: true,
      companyUserId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          id: true,
          companyId: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  const company = await getCurrentCompany();
  const usable =
    reset &&
    !reset.usedAt &&
    reset.expiresAt > new Date() &&
    reset.user?.isActive &&
    reset.user.companyId === company.id;

  // Um só motivo para o visitante: expirado, já usado, inexistente e de conta
  // desativada são indistinguíveis de fora.
  if (!usable) {
    throw new AuthError('invalid_token', INVALID_TOKEN_MESSAGE);
  }

  let passwordHash;
  try {
    passwordHash = await hashPassword(data.password);
  } catch (error) {
    if (error instanceof PasswordPolicyError) {
      throw new AuthError('validation_error', 'Dados inválidos.', {
        password: error.message,
      });
    }
    throw error;
  }

  const changedAt = new Date();

  const [, marked] = await prisma.$transaction([
    prisma.companyUser.update({
      where: { id: reset.companyUserId },
      data: { passwordHash, passwordChangedAt: changedAt },
    }),
    // `updateMany` com `usedAt: null` no filtro: se outra requisição chegou
    // primeiro, esta atualiza zero linhas e sabemos que houve corrida.
    prisma.passwordReset.updateMany({
      where: { id: reset.id, usedAt: null },
      data: { usedAt: changedAt },
    }),
  ]);

  if (marked.count === 0) {
    throw new AuthError('invalid_token', INVALID_TOKEN_MESSAGE);
  }

  return {
    user: { id: reset.user.id, name: reset.user.name, email: reset.user.email },
  };
}
