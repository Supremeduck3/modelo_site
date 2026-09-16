import { z } from 'zod';

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
  const result = loginInputSchema.safeParse(input);
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
