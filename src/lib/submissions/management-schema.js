import { z } from 'zod';
import {
  SUBMISSION_PRIORITY_VALUES,
  SUBMISSION_STATUS_VALUES,
  SUBMISSION_TYPE_VALUES,
} from './constants.js';

/**
 * Entradas do atendimento no painel: filtros da lista e as três ações do
 * detalhe (classificar, anotar, responder).
 *
 * Compartilhado com os formulários do painel pelo mesmo motivo do canal
 * público: o cliente valida para dar retorno rápido, o servidor revalida porque
 * é ele quem decide.
 */

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/**
 * Vazio e ausente são a mesma coisa num filtro: "não filtre por isto".
 *
 * Valor desconhecido também é descartado, em vez de recusado. A URL não é um
 * formulário: um link antigo, um valor renomeado ou alguém editando a query
 * string não podem derrubar a fila de trabalho — mostram a lista sem aquele
 * filtro.
 */
const optionalEnum = (values) =>
  z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : trimmed(value)),
      z.enum(values).optional(),
    )
    .catch(undefined);

export const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const submissionFiltersSchema = z.object({
  status: optionalEnum(SUBMISSION_STATUS_VALUES),
  type: optionalEnum(SUBMISSION_TYPE_VALUES),
  priority: optionalEnum(SUBMISSION_PRIORITY_VALUES),
  categoryId: z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : trimmed(value)),
      z.string().max(64).optional(),
    )
    .catch(undefined),
  assignedTo: z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : trimmed(value)),
      // "nobody" filtra as que ainda não têm responsável — é a pergunta que a
      // equipe realmente faz ("o que ninguém pegou?"), e um id não expressaria.
      z.union([z.literal('nobody'), z.string().max(64)]).optional(),
    )
    .catch(undefined),
  search: z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : trimmed(value)),
      // Busca longa demais é cortada, não recusada.
      z.string().max(150).optional(),
    )
    .catch(undefined),
  archived: z.preprocess(
    (value) => value === 'true' || value === true,
    z.boolean().default(false),
  ),
  page: z.preprocess((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, z.number().int().min(1).default(1)),
  pageSize: z.preprocess((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, MAX_PAGE_SIZE)
      : PAGE_SIZE;
  }, z.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE)),
});

/**
 * Classificação: todos os campos opcionais, mas ao menos um precisa vir.
 *
 * `null` é significativo e diferente de ausente: `categoryId: null` remove a
 * categoria, enquanto não mandar o campo deixa como está.
 */
export const submissionClassificationSchema = z
  .object({
    status: z.enum(SUBMISSION_STATUS_VALUES).optional(),
    priority: z.enum(SUBMISSION_PRIORITY_VALUES).optional(),
    categoryId: z
      .preprocess(
        (value) => (value === '' ? null : trimmed(value)),
        z.string().max(64).nullable(),
      )
      .optional(),
    assignedTo: z
      .preprocess(
        (value) => (value === '' ? null : trimmed(value)),
        z.string().max(64).nullable(),
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para alterar.',
  });

export const internalNoteSchema = z.object({
  note: z.preprocess(
    trimmed,
    z
      .string()
      .min(2, 'Escreva a nota antes de salvar.')
      .max(5000, 'A nota deve ter no máximo 5000 caracteres.'),
  ),
});

export const publicResponseSchema = z.object({
  response: z.preprocess(
    trimmed,
    z
      .string()
      .min(10, 'A resposta precisa de ao menos 10 caracteres.')
      .max(5000, 'A resposta deve ter no máximo 5000 caracteres.'),
  ),
  /**
   * Situação aplicada junto com a resposta.
   *
   * Responder e encerrar costuma ser um gesto só; separá-los em duas ações
   * deixaria manifestação respondida parada como "nova".
   */
  status: z.enum(SUBMISSION_STATUS_VALUES).optional(),
});

/** Achata os erros no formato que os formulários do projeto consomem. */
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

export function validateSubmissionFilters(input) {
  return flatten(submissionFiltersSchema.safeParse(input));
}

export function validateClassification(input) {
  return flatten(submissionClassificationSchema.safeParse(input));
}

export function validateInternalNote(input) {
  return flatten(internalNoteSchema.safeParse(input));
}

export function validatePublicResponse(input) {
  return flatten(publicResponseSchema.safeParse(input));
}
