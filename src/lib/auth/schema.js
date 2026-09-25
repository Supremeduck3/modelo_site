/*
 * Validação de acesso ao painel.
 *
 * Usa `zod/mini` em vez do zod completo porque estes schemas são
 * compartilhados com as telas públicas de acesso: o zod completo levava ~89 KB
 * de JavaScript ao navegador só para conferir um e-mail e um comprimento de
 * senha. `mini` é a mesma biblioteca com a API em funções, então continua
 * havendo um único lugar onde a regra vive — o servidor revalida com este
 * mesmo arquivo.
 *
 * Na dúvida entre encurtar aqui e duplicar a regra no cliente: duplicar é que
 * sai caro, porque as duas cópias saem de sincronia sem ninguém ver.
 */
import * as z from 'zod/mini';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password-rules.js';

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/**
 * E-mail: apara espaços e normaliza para minúsculas antes de conferir.
 *
 * A checagem de formato é uma expressão simples de propósito. Quem decide se o
 * endereço existe é o envio; aqui só se pega o erro de digitação óbvio, e uma
 * expressão ambiciosa recusaria endereço válido raro.
 */
const emailSchema = z.pipe(
  z.transform((value) => {
    const texto = trimmed(value);
    return typeof texto === 'string' ? texto.toLowerCase() : texto;
  }),
  z
    .string({ message: 'Informe seu e-mail.' })
    .check(
      z.minLength(1, 'Informe seu e-mail.'),
      z.maxLength(200, 'E-mail longo demais.'),
      z.regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.'),
    ),
);

/**
 * Schema de login, compartilhado entre o formulário do painel e a API.
 *
 * Só verifica o formato do que foi digitado. As regras de força de senha valem
 * na criação e na troca (`PASSWORD_RULES`), nunca no login: aplicá-las aqui
 * faria o formulário recusar antes do servidor a senha de um usuário antigo e
 * vazaria a política para quem só está tentando entrar.
 */
export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string({ message: 'Informe sua senha.' }).check(
    z.minLength(1, 'Informe sua senha.'),
    // O limite espelha o do hash: senha maior que isso nem chega ao scrypt.
    z.maxLength(200, 'Senha longa demais.'),
  ),
});

/**
 * Pedido de recuperação de senha.
 *
 * Só o e-mail: qualquer outro campo aqui seria informação que o formulário não
 * precisa pedir para um fluxo que responde igual em todos os casos.
 */
export const forgotPasswordInputSchema = z.object({ email: emailSchema });

/**
 * Definição da nova senha a partir do link recebido.
 *
 * Aqui a política vale: é criação de senha, não login. A confirmação existe
 * para o usuário não ficar trancado fora por um erro de digitação — quem acabou
 * de redefinir não tem outro caminho de volta.
 */
export const resetPasswordInputSchema = z
  .object({
    token: z.pipe(
      z.transform(trimmed),
      z
        .string({ message: 'Link de recuperação inválido.' })
        .check(z.minLength(1, 'Link de recuperação inválido.')),
    ),
    password: z
      .string({ message: 'Informe a nova senha.' })
      .check(
        z.minLength(
          PASSWORD_MIN_LENGTH,
          `A senha precisa de ao menos ${PASSWORD_MIN_LENGTH} caracteres.`,
        ),
        z.maxLength(
          PASSWORD_MAX_LENGTH,
          `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
        ),
      ),
    passwordConfirmation: z.string({ message: 'Repita a nova senha.' }),
  })
  .check(
    z.refine((data) => data.password === data.passwordConfirmation, {
      path: ['passwordConfirmation'],
      message: 'As senhas não coincidem.',
    }),
  );

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

/**
 * Valida uma entrada de login e devolve { success, data, errors } com os erros
 * achatados por campo, no mesmo formato que o formulário público consome.
 */
export function validateLoginInput(input) {
  return flatten(loginInputSchema.safeParse(input));
}

export function validateForgotPasswordInput(input) {
  return flatten(forgotPasswordInputSchema.safeParse(input));
}

export function validateResetPasswordInput(input) {
  return flatten(resetPasswordInputSchema.safeParse(input));
}
