import { z } from 'zod';

/**
 * Entradas das telas de categorias e configurações da empresa.
 *
 * Compartilhado com os formulários do painel, como no resto do molde: o cliente
 * valida para dar retorno rápido, o servidor revalida porque é ele quem decide.
 */

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/**
 * Teto de faixas de horário.
 *
 * Exportado porque a tela também precisa dele para decidir quando esconder o
 * botão de adicionar. Com o número em dois lugares, um lado mudaria e o outro
 * passaria a recusar em silêncio o que a tela oferece.
 */
export const MAX_BUSINESS_HOURS = 7;

/** Campo de texto opcional: vazio vira null, não string vazia. */
const optionalText = (max, rotulo) =>
  z.preprocess((value) => {
    const text = trimmed(value);
    if (text === '' || text === null || text === undefined) return null;
    return text;
  }, z
    .string()
    .max(max, `${rotulo} deve ter no máximo ${max} caracteres.`)
    .nullable());

export const categorySchema = z.object({
  name: z.preprocess(
    trimmed,
    z
      .string()
      .min(2, 'Informe o nome da categoria.')
      .max(60, 'O nome deve ter no máximo 60 caracteres.'),
  ),
  description: optionalText(200, 'A descrição'),
});

export const categoryActiveSchema = z.object({
  isActive: z.boolean({ message: 'Informe a situação da categoria.' }),
});

/**
 * Dados operacionais da empresa.
 *
 * É o que a empresa realmente possui e usa no dia a dia — o que aparece nos
 * e-mails que ela envia e no cabeçalho do painel. A identidade do site público
 * continua vindo da configuração da implantação, que é decisão do
 * implementador; ver a nota na tela e no README.
 */
export const companySettingsSchema = z.object({
  name: z.preprocess(
    trimmed,
    z
      .string()
      .min(2, 'Informe o nome da empresa.')
      .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  ),
  email: z.preprocess((value) => {
    const text = trimmed(value);
    // `null` precisa sair como `null`: sem esta checagem `String(null)` vira o
    // literal "null", e a empresa que apaga o e-mail recebe "informe um e-mail
    // válido" sem entender o motivo.
    if (text === '' || text === null || text === undefined) return null;
    return String(text).toLowerCase();
  }, z.string().email('Informe um e-mail válido.').max(200).nullable()),
  phone: optionalText(30, 'O telefone'),
  website: z.preprocess(
    (value) => {
      const text = trimmed(value);
      return text === '' || text === undefined ? null : text;
    },
    z
      .string()
      .max(200, 'O endereço deve ter no máximo 200 caracteres.')
      .refine(
        (value) => /^https?:\/\//i.test(value),
        'O endereço precisa começar com http:// ou https://',
      )
      .nullable(),
  ),
  description: optionalText(500, 'A descrição'),
  segment: optionalText(80, 'O segmento'),
  city: optionalText(80, 'A cidade'),
  // UF normalizada e conferida no servidor: sem isso "sp" e "1x" entravam no
  // banco, porque o toUpperCase só existia na tela.
  state: z.preprocess(
    (value) => {
      const text = trimmed(value);
      if (text === '' || text === null || text === undefined) return null;
      return String(text).toUpperCase();
    },
    z
      .string()
      .regex(/^[A-Z]{2}$/, 'Use a sigla do estado, com duas letras.')
      .nullable(),
  ),
  businessHours: z
    .preprocess(
      (value) => {
        if (!Array.isArray(value)) return value;
        // Linha totalmente vazia é descarte, não erro: a tela cria uma ao
        // clicar em "adicionar" e o usuário pode desistir de preenchê-la. A
        // regra vive aqui para valer também para quem chama a API direto.
        return value.filter((row) => {
          if (!row || typeof row !== 'object') return true;
          const days = String(row.days ?? '').trim();
          const hours = String(row.hours ?? '').trim();
          return days !== '' || hours !== '';
        });
      },
      z
        .array(
          z.object({
            days: z.preprocess(
              trimmed,
              z
                .string()
                .min(1, 'Preencha os dias desta faixa, ou remova a linha.')
                .max(60, 'Os dias devem ter no máximo 60 caracteres.'),
            ),
            hours: z.preprocess(
              trimmed,
              z
                .string()
                .min(1, 'Preencha o horário desta faixa, ou remova a linha.')
                .max(60, 'O horário deve ter no máximo 60 caracteres.'),
            ),
          }),
        )
        .max(
          MAX_BUSINESS_HOURS,
          `No máximo ${MAX_BUSINESS_HOURS} faixas de horário.`,
        ),
    )
    .default([]),
});

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

export function validateCategory(input) {
  return flatten(categorySchema.safeParse(input));
}

export function validateCategoryActive(input) {
  return flatten(categoryActiveSchema.safeParse(input));
}

export function validateCompanySettings(input) {
  return flatten(companySettingsSchema.safeParse(input));
}
