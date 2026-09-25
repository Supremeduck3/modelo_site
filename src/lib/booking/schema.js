/*
 * Pedido de agendamento: validação compartilhada entre o formulário público e
 * a API.
 *
 * `zod/mini` pelo mesmo motivo do canal de manifestações: este arquivo chega
 * ao celular do cliente, e o zod completo custava ~89 KB. O que depende da
 * implantação (dias abertos, períodos oferecidos, serviço existente) o
 * servidor confere depois; aqui fica o formato.
 */
import * as z from 'zod/mini';
import { BOOKING_PERIOD_VALUES } from './constants.js';
import { isValidDate } from './dates.js';

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

const texto = (min, max, mensagemMin, mensagemMax) =>
  z.pipe(
    z.transform(trimmed),
    z
      .string({ message: mensagemMin })
      .check(z.minLength(min, mensagemMin), z.maxLength(max, mensagemMax)),
  );

/** Vazio vira null; com texto, respeita o limite. */
const opcional = (max, mensagem) =>
  z.pipe(
    z.transform((value) => {
      const t = trimmed(value);
      return t === '' || t === undefined ? null : t;
    }),
    z.union([z.string().check(z.maxLength(max, mensagem)), z.null()]),
  );

/**
 * Telefone: guardamos só os dígitos. É por ele que a empresa confirma — no
 * WhatsApp —, então tem de ser número de verdade: DDD + 8 ou 9 dígitos, com
 * ou sem o 55.
 */
const telefone = z.pipe(
  z.transform((value) => String(value ?? '').replace(/\D/g, '')),
  z
    .string()
    .check(
      z.minLength(10, 'Informe o WhatsApp com DDD.'),
      z.maxLength(13, 'Confira o número: parece ter dígitos a mais.'),
    ),
);

export const appointmentRequestSchema = z.object({
  serviceId: z
    .string({ message: 'Escolha o serviço.' })
    .check(z.minLength(1, 'Escolha o serviço.')),
  professional: opcional(80, 'Profissional inválido.'),
  date: z
    .string({ message: 'Escolha o dia.' })
    .check(z.refine(isValidDate, 'Escolha o dia.')),
  period: z.enum(BOOKING_PERIOD_VALUES, { message: 'Escolha o período.' }),
  customerName: texto(
    2,
    80,
    'Informe seu nome.',
    'O nome deve ter no máximo 80 caracteres.',
  ),
  customerPhone: telefone,
  customerEmail: z.pipe(
    z.transform((value) => {
      const t = trimmed(value);
      return t === '' || t === undefined ? null : t;
    }),
    z.union([
      z
        .string()
        .check(
          z.maxLength(200, 'E-mail longo demais.'),
          z.regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.'),
        ),
      z.null(),
    ]),
  ),
  notes: opcional(500, 'A observação deve ter no máximo 500 caracteres.'),
});

/** Achata os erros por campo, no formato que o formulário usa. */
export function validateAppointmentRequest(input) {
  const result = appointmentRequestSchema.safeParse(input ?? {});
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
