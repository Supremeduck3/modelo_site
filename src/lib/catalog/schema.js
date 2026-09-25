import { z } from 'zod';
import { parsePriceToCents } from './format.js';

/**
 * Entrada de um item da tabela de serviços, vinda do painel.
 *
 * O zod completo é aceitável aqui: a tela é do painel, que já carrega o Ant
 * Design. O site público só usa `format.js`.
 */

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

const optionalText = (max, rotulo) =>
  z.preprocess((value) => {
    const text = trimmed(value);
    if (text === '' || text === null || text === undefined) return null;
    return text;
  }, z
    .string()
    .max(max, `${rotulo} deve ter no máximo ${max} caracteres.`)
    .nullable());

/** Teto de preço: acima disso é quase certamente um zero digitado a mais. */
export const MAX_PRICE_CENTS = 100_000_00;

export const offeringSchema = z.object({
  name: z.preprocess(
    trimmed,
    z
      .string({ message: 'Informe o nome do serviço.' })
      .min(2, 'Informe o nome do serviço.')
      .max(80, 'O nome deve ter no máximo 80 caracteres.'),
  ),
  description: optionalText(300, 'A descrição'),
  category: optionalText(40, 'A categoria'),
  price: z.preprocess(
    (value) => parsePriceToCents(value),
    z
      .number({ message: 'Informe o preço como 35 ou 35,90.' })
      .int()
      .min(0, 'O preço não pode ser negativo.')
      .max(MAX_PRICE_CENTS, 'Preço acima do permitido. Confira os zeros.')
      .nullable(),
  ),
  priceFrom: z.boolean().optional().default(false),
  durationMinutes: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z
      .number({ message: 'Informe a duração em minutos.' })
      .int('Informe a duração em minutos inteiros.')
      .min(5, 'A duração mínima é de 5 minutos.')
      .max(600, 'A duração máxima é de 10 horas.')
      .nullable(),
  ),
  bookable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

/** Achata erros por campo, no formato que os formulários do painel usam. */
export function validateOffering(input) {
  const result = offeringSchema.safeParse(input ?? {});
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
