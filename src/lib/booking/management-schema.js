import { z } from 'zod';
import { APPOINTMENT_ACTIONS } from './constants.js';
import { isValidDate, isValidTime } from './dates.js';

/**
 * Ações da equipe sobre um pedido de agendamento (painel).
 *
 * Confirmar e propor exigem dia e hora; as outras não. A mensagem é o que o
 * cliente vê na página de acompanhamento e recebe no aviso — por isso tem
 * limite, e não é nota interna.
 */
export const appointmentActionSchema = z
  .object({
    action: z.enum(Object.keys(APPOINTMENT_ACTIONS), {
      message: 'Ação inválida.',
    }),
    date: z.string().optional(),
    time: z.string().optional(),
    message: z.preprocess((value) => {
      const t = typeof value === 'string' ? value.trim() : value;
      return t === '' || t === undefined ? null : t;
    }, z
      .string()
      .max(500, 'A mensagem deve ter no máximo 500 caracteres.')
      .nullable()),
  })
  .superRefine((data, ctx) => {
    if (!APPOINTMENT_ACTIONS[data.action]?.needsSchedule) return;

    if (!isValidDate(data.date)) {
      ctx.addIssue({
        code: 'custom',
        path: ['date'],
        message: 'Escolha o dia.',
      });
    }
    if (!isValidTime(data.time)) {
      ctx.addIssue({
        code: 'custom',
        path: ['time'],
        message: 'Informe o horário (ex.: 14:30).',
      });
    }
  });

export function validateAppointmentAction(input) {
  const result = appointmentActionSchema.safeParse(input ?? {});
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
