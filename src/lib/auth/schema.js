import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password-rules.js';

/**
 * Schema de login, compartilhado entre o formulário do painel e a API.
 *
 * Só verifica o formato do que foi digitado. As regras de força de senha valem
 * na criação e na troca (`PASSWORD_RULES`), nunca no login: aplicá-las aqui
 * faria o formulário recusar antes do servidor a senha de um usuário antigo e
 * vazaria a política para quem só está tentando entrar.
 */

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

export const loginInputSchema = z.object({
  email: z.preprocess((value) => {
    const text = trimmed(value);
    return typeof text === 'string' ? text.toLowerCase() : text;
  }, z
    .string()
    .min(1, 'Informe seu e-mail.')
    .max(200, 'E-mail longo demais.')
    .email('Informe um e-mail válido.')),
  password: z
    .string({ message: 'Informe sua senha.' })
    .min(1, 'Informe sua senha.')
    // O limite espelha o do hash: senha maior que isso nem chega ao scrypt.
    .max(200, 'Senha longa demais.'),
});

/**
 * Valida uma entrada de login e devolve { success, data, errors } com os erros
 * achatados por campo, no mesmo formato que o formulário público consome.
 */
export function validateLoginInput(input) {
  return flatten(loginInputSchema.safeParse(input));
}

/**
 * Pedido de recuperação de senha.
 *
 * Só o e-mail: qualquer outro campo aqui seria informação que o formulário não
 * precisa pedir para um fluxo que responde igual em todos os casos.
 */
export const forgotPasswordInputSchema = z.object({
  email: z.preprocess((value) => {
    const text = trimmed(value);
    return typeof text === 'string' ? text.toLowerCase() : text;
  }, z
    .string()
    .min(1, 'Informe seu e-mail.')
    .max(200, 'E-mail longo demais.')
    .email('Informe um e-mail válido.')),
});

/**
 * Definição da nova senha a partir do link recebido.
 *
 * Aqui a política vale: é criação de senha, não login. A confirmação existe
 * para o usuário não ficar trancado fora por um erro de digitação — quem acabou
 * de redefinir não tem outro caminho de volta.
 */
export const resetPasswordInputSchema = z
  .object({
    token: z.preprocess(
      trimmed,
      z.string().min(1, 'Link de recuperação inválido.'),
    ),
    password: z
      .string({ message: 'Informe a nova senha.' })
      .min(
        PASSWORD_MIN_LENGTH,
        `A senha precisa de ao menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
      ),
    passwordConfirmation: z.string({ message: 'Repita a nova senha.' }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirmation'],
        message: 'As senhas não coincidem.',
      });
    }
  });

/** Achata os erros de um schema no formato que os formulários consomem. */
function flatten(result) {
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] ?? 'form';
    if (!errors[field]) errors[field] = issue.message;
  }

  return { success: false, data: null, errors };
}

export function validateForgotPasswordInput(input) {
  return flatten(forgotPasswordInputSchema.safeParse(input));
}

export function validateResetPasswordInput(input) {
  return flatten(resetPasswordInputSchema.safeParse(input));
}
