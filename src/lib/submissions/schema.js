import { z } from 'zod';
import { SUBMISSION_TYPE_VALUES } from './constants.js';

/**
 * Schema compartilhado entre o formulário público e a API.
 *
 * O cliente usa para dar retorno imediato; o servidor revalida sempre, porque
 * validação de frontend não é controle de segurança.
 */

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

const optionalText = (max) =>
  z
    .preprocess(trimmed, z.string().max(max))
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? null : (value ?? null)));

export const submissionInputSchema = z
  .object({
    type: z.enum(SUBMISSION_TYPE_VALUES, {
      message: 'Escolha o tipo da manifestação.',
    }),
    categoryId: optionalText(64),
    title: z.preprocess(
      trimmed,
      z
        .string()
        .min(5, 'O assunto precisa de ao menos 5 caracteres.')
        .max(150, 'O assunto deve ter no máximo 150 caracteres.'),
    ),
    description: z.preprocess(
      trimmed,
      z
        .string()
        .min(20, 'Descreva com ao menos 20 caracteres.')
        .max(5000, 'A descrição deve ter no máximo 5000 caracteres.'),
    ),
    contactName: optionalText(120),
    contactEmail: z
      .preprocess(trimmed, z.string().email('Informe um e-mail válido.'))
      .optional()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : (value ?? null))),
    contactPhone: optionalText(30),
    consent: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    // Sem nenhum contato a empresa não consegue responder; o canal deixa de
    // fazer sentido. Exigimos ao menos um meio.
    if (!data.contactEmail && !data.contactPhone) {
      ctx.addIssue({
        code: 'custom',
        path: ['contactEmail'],
        message: 'Informe um e-mail ou um telefone para retorno.',
      });
    }
  });

/**
 * Valida uma entrada e devolve { success, data, errors } com os erros já
 * achatados por campo, no formato que o formulário consome.
 */
export function validateSubmissionInput(input) {
  const result = submissionInputSchema.safeParse(input);
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
