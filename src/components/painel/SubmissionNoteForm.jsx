'use client';

import { Alert, Button, Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { validateInternalNote } from '@/lib/submissions/management-schema';

const { TextArea } = Input;

const GENERIC_ERROR =
  'Não foi possível salvar a nota agora. Tente novamente em instantes.';

/**
 * Nota interna: registro de uso exclusivo da equipe. Nunca é enviada ao
 * visitante nem aparece em nenhuma tela pública — o rótulo e a ajuda deixam
 * isso explícito para não ser confundida com a resposta pública.
 */
export default function SubmissionNoteForm({ submissionId, canManage }) {
  const router = useRouter();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !canManage) return;

    setFormError('');

    const result = validateInternalNote({ note });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/painel/manifestacoes/${submissionId}/notas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data),
        },
      );

      if (response.ok) {
        setNote('');
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      const error = body?.error;

      if (response.status === 400 && error?.details) {
        setErrors(error.details);
      }

      setFormError(error?.message ?? GENERIC_ERROR);
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canManage) return null;

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

      <div>
        <label htmlFor={fieldId('note')}>Nota interna</label>
        <p style={{ margin: '4px 0 8px', fontSize: '0.875rem' }}>
          Visível só para a equipe. O visitante nunca vê este texto.
        </p>
        <TextArea
          id={fieldId('note')}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          status={errors.note ? 'error' : undefined}
          aria-describedby={
            errors.note ? `${fieldId('note')}-error` : undefined
          }
        />
        {errors.note && (
          <p id={`${fieldId('note')}-error`} role="alert">
            {errors.note}
          </p>
        )}
      </div>

      <Button
        type="primary"
        htmlType="submit"
        loading={submitting}
        style={{ marginTop: 12 }}
      >
        Salvar nota
      </Button>
    </form>
  );
}
