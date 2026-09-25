/*
 * Schema compartilhado entre o formulário público e a API.
 *
 * O cliente usa para dar retorno imediato; o servidor revalida sempre, porque
 * validação de frontend não é controle de segurança.
 *
 * Usa `zod/mini` porque este arquivo chega ao navegador: o zod completo levava
 * ~89 KB de JavaScript para a página do canal, que é justamente a que o
 * visitante abre com pressa e às vezes no celular. `mini` é a mesma
 * biblioteca com a API em funções, então a regra continua morando num lugar só.
 */
import * as z from 'zod/mini';
import { SUBMISSION_TYPE_VALUES } from './constants.js';

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/**
 * Texto aparado, com limite, onde vazio significa "não informado" (null).
 *
 * O limite leva mensagem própria: sem ela o visitante recebia o texto genérico
 * da biblioteca, que não diz qual campo passou nem de quanto é o limite.
 */
const optionalText = (max, campo) =>
  z.pipe(
    z.transform(trimmed),
    z.pipe(
      z.union([
        z
          .string()
          .check(
            z.maxLength(max, `${campo} deve ter no máximo ${max} caracteres.`),
          ),
        z.null(),
        z.undefined(),
      ]),
      z.transform((value) => (value === '' ? null : (value ?? null))),
    ),
  );

const texto = (min, max, mensagemMin, mensagemMax) =>
  z.pipe(
    z.transform(trimmed),
    z
      .string({ message: mensagemMin })
      .check(z.minLength(min, mensagemMin), z.maxLength(max, mensagemMax)),
  );

export const submissionInputSchema = z
  .object({
    type: z.enum(SUBMISSION_TYPE_VALUES, {
      message: 'Escolha o tipo da manifestação.',
    }),
    categoryId: optionalText(64, 'A categoria'),
    title: texto(
      5,
      150,
      'O assunto precisa de ao menos 5 caracteres.',
      'O assunto deve ter no máximo 150 caracteres.',
    ),
    description: texto(
      20,
      5000,
      'Descreva com ao menos 20 caracteres.',
      'A descrição deve ter no máximo 5000 caracteres.',
    ),
    contactName: optionalText(120, 'O nome'),
    contactEmail: z.pipe(
      z.transform(trimmed),
      z.pipe(
        z.union([
          z
            .string()
            .check(
              z.regex(
                /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                'Informe um e-mail válido.',
              ),
            ),
          z.literal(''),
          z.null(),
          z.undefined(),
        ]),
        z.transform((value) => (value === '' ? null : (value ?? null))),
      ),
    ),
    contactPhone: optionalText(30, 'O telefone'),
    consent: z._default(z.optional(z.boolean()), false),
  })
  .check(
    // Sem nenhum contato a empresa não consegue responder; o canal deixa de
    // fazer sentido. Exigimos ao menos um meio.
    z.refine((data) => Boolean(data.contactEmail || data.contactPhone), {
      path: ['contactEmail'],
      message: 'Informe um e-mail ou um telefone para retorno.',
    }),
  );

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
