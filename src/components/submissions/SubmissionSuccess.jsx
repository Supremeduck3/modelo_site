'use client';

import { useState } from 'react';
import { labelOf, SUBMISSION_TYPES } from '@/lib/submissions/constants';
import styles from './submission-success.module.css';

/**
 * Confirmação exibida após o registro de uma manifestação.
 *
 * Recebe o objeto `submission` devolvido pela API (POST /api/submissions,
 * resposta 201): { protocol, title, type, createdAt }.
 */
export default function SubmissionSuccess({ submission }) {
  const [copied, setCopied] = useState(false);

  if (!submission) return null;

  const { protocol, title, type, createdAt } = submission;

  const formattedDate = createdAt
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(createdAt))
    : null;

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(protocol);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Cópia é um atalho de conveniência; falha silenciosa não impede o fluxo.
    }
  }

  return (
    <div className={styles.wrapper} role="status">
      <p className={styles.badge}>Manifestação registrada</p>
      <h3 className={styles.heading}>Recebemos sua manifestação</h3>
      <p className={styles.text}>
        Guarde o protocolo abaixo para acompanhar o andamento. Ele também é o
        código que a nossa equipe usa para localizar seu registro.
      </p>

      <div className={styles.protocolBox}>
        <span className={styles.protocolLabel}>Protocolo</span>
        <span className={styles.protocolValue}>{protocol}</span>
        <button
          type="button"
          className={styles.copyButton}
          onClick={handleCopy}
        >
          {copied ? 'Copiado!' : 'Copiar protocolo'}
        </button>
      </div>

      <dl className={styles.details}>
        {title && (
          <div className={styles.detailRow}>
            <dt>Assunto</dt>
            <dd>{title}</dd>
          </div>
        )}
        {type && (
          <div className={styles.detailRow}>
            <dt>Tipo</dt>
            <dd>{labelOf(SUBMISSION_TYPES, type)}</dd>
          </div>
        )}
        {formattedDate && (
          <div className={styles.detailRow}>
            <dt>Enviado em</dt>
            <dd>{formattedDate}</dd>
          </div>
        )}
      </dl>

      <div className={styles.nextSteps}>
        <h4 className={styles.nextStepsTitle}>Próximos passos</h4>
        <ol className={styles.nextStepsList}>
          <li>Anote ou copie o protocolo acima.</li>
          <li>
            Nossa equipe vai analisar sua manifestação e entrar em contato pelos
            dados informados.
          </li>
          <li>
            Use o protocolo para consultar o andamento sempre que precisar.
          </li>
        </ol>
      </div>
    </div>
  );
}
