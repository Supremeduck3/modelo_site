/**
 * Constantes de domínio das manifestações.
 *
 * Ficam em um único lugar porque são compartilhadas por validação, API,
 * formulário público e (na fase 5) painel da empresa.
 */

/** Tipos de manifestação aceitos pelo canal. */
export const SUBMISSION_TYPES = [
  { value: 'complaint', label: 'Reclamação' },
  { value: 'compliment', label: 'Elogio' },
  { value: 'suggestion', label: 'Sugestão' },
  { value: 'question', label: 'Dúvida' },
  { value: 'request', label: 'Solicitação' },
  { value: 'other', label: 'Outro' },
];

export const SUBMISSION_TYPE_VALUES = SUBMISSION_TYPES.map((t) => t.value);

/** Ciclo de vida de uma manifestação. */
export const SUBMISSION_STATUSES = [
  { value: 'new', label: 'Nova' },
  { value: 'in_review', label: 'Em análise' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'waiting_customer', label: 'Aguardando cliente' },
  { value: 'resolved', label: 'Resolvida' },
  { value: 'closed', label: 'Encerrada' },
];

export const SUBMISSION_STATUS_VALUES = SUBMISSION_STATUSES.map((s) => s.value);

/** Prioridade é de uso interno: nunca é escolhida pelo visitante. */
export const SUBMISSION_PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export const SUBMISSION_PRIORITY_VALUES = SUBMISSION_PRIORITIES.map(
  (p) => p.value,
);

/** Tipos de evento registrados no histórico auditável. */
export const SUBMISSION_EVENTS = {
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  CATEGORY_CHANGED: 'category_changed',
  PRIORITY_CHANGED: 'priority_changed',
  ASSIGNED: 'assigned',
  INTERNAL_NOTE: 'internal_note',
  PUBLIC_RESPONSE: 'public_response',
};

/** Rótulo legível de um valor de domínio, com fallback para o próprio valor. */
export function labelOf(list, value) {
  return list.find((item) => item.value === value)?.label ?? value;
}
