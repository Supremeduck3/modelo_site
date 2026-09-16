'use client';

import { Alert, App, Button, Input, Select } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { SUBMISSION_STATUSES } from '@/lib/submissions/constants';
import { validatePublicResponse } from '@/lib/submissions/management-schema';

const { TextArea } = Input;

const GENERIC_ERROR =
  'Não foi possível enviar a resposta agora. Tente novamente em instantes.';

const DEFAULT_STATUS = 'resolved';

/**
 * Resposta ao visitante. Este texto é a única parte do painel que o
 * visitante chega a ver — por isso o rótulo e a ajuda deixam isso explícito,
 * e por que reenviar substitui a resposta anterior sem aviso além deste.
 */
export default function SubmissionResponseForm({ submission, canManage }) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [response, setResponse] = useState('');
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !canManage) return;

    setFormError('');

    const result = validatePublicResponse({ response, status });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const apiResponse = await fetch(
        `/api/painel/manifestacoes/${submission.id}/resposta`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data),
        },
      );

      if (apiResponse.ok) {
        message.success('Resposta enviada.');
        setResponse('');
        router.refresh();
        return;
      }

      const body = await apiResponse.json().catch(() => null);
      const error = body?.error;

      if (apiResponse.status === 400 && error?.details) {
        setErrors(error.details);
      }

      setFormError(error?.message ?? GENERIC_ERROR);
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <Alert
          type="error"
          message={formError}
          showIcon
          role="alert"
          style={{ marginBottom: 16 }}
        />
      )}

      {submission.publicResponse && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Já existe uma resposta enviada a este visitante"
          description={
            <>
              <p>{submission.publicResponse}</p>
              <p>Enviar uma nova resposta substitui a atual.</p>
            </>
          }
        />
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label htmlFor={fieldId('response')}>Resposta ao visitante</label>
          <p style={{ margin: '4px 0 8px', fontSize: '0.875rem' }}>
            {submission.contactEmail
              ? `Este texto será enviado por e-mail para ${submission.contactEmail}.`
              : 'Este visitante não informou e-mail: a resposta ficará registrada, mas não há como enviá-la.'}
          </p>
          <TextArea
            id={fieldId('response')}
            disabled={!canManage}
            rows={5}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            status={errors.response ? 'error' : undefined}
            aria-describedby={
              errors.response ? `${fieldId('response')}-error` : undefined
            }
          />
          {errors.response && (
            <p id={`${fieldId('response')}-error`} role="alert">
              {errors.response}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('status')}>Situação após responder</label>
          <Select
            id={fieldId('status')}
            disabled={!canManage}
            value={status}
            onChange={setStatus}
            options={SUBMISSION_STATUSES}
            style={{ width: '100%' }}
          />
        </div>

        {canManage && (
          <Button type="primary" htmlType="submit" loading={submitting}>
            Enviar resposta
          </Button>
        )}
      </div>
    </form>
  );
}
