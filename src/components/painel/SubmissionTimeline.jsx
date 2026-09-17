import { Tag, Timeline } from 'antd';
import {
  labelOf,
  SUBMISSION_EVENTS,
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
} from '@/lib/submissions/constants';
import { TAG_SOLIDO } from './tag-colors';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actorName(event) {
  if (event.actor?.name) return event.actor.name;
  return event.eventType === SUBMISSION_EVENTS.CREATED
    ? 'visitante'
    : 'sistema';
}

function describe(event, categories) {
  const categoryName = (id) =>
    categories?.find((category) => category.id === id)?.name;

  switch (event.eventType) {
    case SUBMISSION_EVENTS.CREATED:
      return 'Manifestação registrada';
    case SUBMISSION_EVENTS.STATUS_CHANGED:
      return `Situação: ${labelOf(SUBMISSION_STATUSES, event.fromValue)} → ${labelOf(SUBMISSION_STATUSES, event.toValue)}`;
    case SUBMISSION_EVENTS.PRIORITY_CHANGED:
      return `Prioridade: ${labelOf(SUBMISSION_PRIORITIES, event.fromValue)} → ${labelOf(SUBMISSION_PRIORITIES, event.toValue)}`;
    case SUBMISSION_EVENTS.CATEGORY_CHANGED: {
      const from = categoryName(event.fromValue) ?? 'sem categoria';
      const to = categoryName(event.toValue) ?? 'sem categoria';
      return `Categoria alterada: ${from} → ${to}`;
    }
    case SUBMISSION_EVENTS.ASSIGNED:
      return event.toValue
        ? 'Responsável definido/alterado'
        : 'Responsável removido';
    case SUBMISSION_EVENTS.INTERNAL_NOTE:
      return 'Nota interna';
    case SUBMISSION_EVENTS.PUBLIC_RESPONSE:
      return 'Resposta enviada ao visitante';
    default:
      return event.eventType;
  }
}

/**
 * Histórico auditável da manifestação, do mais antigo para o mais recente.
 *
 * Componente de servidor: os dados já vêm prontos do banco, não há interação
 * aqui. A distinção visual entre nota interna e resposta pública importa —
 * uma é só da equipe, a outra vai para o visitante, e confundir as duas é o
 * tipo de erro que este componente existe para evitar.
 */
export default function SubmissionTimeline({ events, categories }) {
  const ordered = [...events].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  return (
    <Timeline
      items={ordered.map((event) => ({
        key: event.id,
        children: (
          <div>
            <p>
              <strong>{describe(event, categories)}</strong>
              {event.eventType === SUBMISSION_EVENTS.INTERNAL_NOTE && (
                <Tag color={TAG_SOLIDO.laranja} style={{ marginLeft: 8 }}>
                  interna — visível só para a equipe
                </Tag>
              )}
            </p>
            {(event.eventType === SUBMISSION_EVENTS.INTERNAL_NOTE ||
              event.eventType === SUBMISSION_EVENTS.PUBLIC_RESPONSE) &&
              event.note && <p>{event.note}</p>}
            <p>
              {actorName(event)} · {formatDate(event.createdAt)}
            </p>
          </div>
        ),
      }))}
    />
  );
}
