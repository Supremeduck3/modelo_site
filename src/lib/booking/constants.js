/**
 * Vocabulário do agendamento: períodos, status, ações e eventos.
 *
 * Sem dependência nenhuma: é lido pelo formulário público, pelo painel, pelo
 * servidor e pela validação da configuração.
 */

/** Períodos que o cliente pode pedir, na ordem do dia. */
export const BOOKING_PERIODS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];
export const BOOKING_PERIOD_VALUES = BOOKING_PERIODS.map((p) => p.value);

export const APPOINTMENT_STATUSES = [
  { value: 'pending', label: 'Aguardando confirmação' },
  { value: 'proposed', label: 'Novo horário proposto' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'declined', label: 'Não foi possível atender' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Atendido' },
  { value: 'no_show', label: 'Não compareceu' },
];

/** Status em que o pedido ainda pede alguma ação ou compromisso. */
export const OPEN_APPOINTMENT_STATUSES = ['pending', 'proposed', 'confirmed'];

/**
 * Ações da equipe e para onde cada uma leva.
 *
 * `from` lista de onde a ação é permitida. Estado terminal (recusado,
 * cancelado, atendido, não compareceu) não tem saída: reabrir um atendimento
 * encerrado reescreveria o histórico que o próprio painel mostra.
 */
export const APPOINTMENT_ACTIONS = {
  confirm: {
    label: 'Confirmar horário',
    to: 'confirmed',
    from: ['pending', 'proposed'],
    needsSchedule: true,
  },
  propose: {
    label: 'Propor outro horário',
    to: 'proposed',
    from: ['pending', 'proposed', 'confirmed'],
    needsSchedule: true,
  },
  decline: {
    label: 'Recusar',
    to: 'declined',
    from: ['pending', 'proposed'],
    needsSchedule: false,
  },
  cancel: {
    label: 'Cancelar',
    to: 'cancelled',
    from: ['proposed', 'confirmed'],
    needsSchedule: false,
  },
  complete: {
    label: 'Marcar como atendido',
    to: 'completed',
    from: ['confirmed'],
    needsSchedule: false,
  },
  no_show: {
    label: 'Não compareceu',
    to: 'no_show',
    from: ['confirmed'],
    needsSchedule: false,
  },
};

/** Ações possíveis a partir de um status, na ordem em que aparecem na tela. */
export function actionsFor(status) {
  return Object.entries(APPOINTMENT_ACTIONS)
    .filter(([, action]) => action.from.includes(status))
    .map(([key]) => key);
}

export const APPOINTMENT_EVENTS = {
  REQUESTED: 'requested',
  STATUS_CHANGED: 'status_changed',
};

export function labelOf(list, value) {
  return list.find((item) => item.value === value)?.label ?? value;
}
