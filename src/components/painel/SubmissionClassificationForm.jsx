'use client';

import { Alert, App, Button, Select } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import {
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
} from '@/lib/submissions/constants';
import { validateClassification } from '@/lib/submissions/management-schema';

const GENERIC_ERROR =
  'Não foi possível salvar agora. Tente novamente em instantes.';

const NO_CATEGORY_VALUE = '';
const NO_ASSIGNEE_VALUE = '';

/**
 * Classificação da manifestação: situação, prioridade, categoria e
 * responsável. Envia só os campos que mudaram; string vazia significa
 * "remover" e o servidor a converte para `null`.
 */
export default function SubmissionClassificationForm({
  submission,
  categories,
  assignees,
  canManage,
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const initial = {
    status: submission.status,
    priority: submission.priority,
    categoryId: submission.category?.id ?? NO_CATEGORY_VALUE,
    assignedTo: submission.assignee?.id ?? NO_ASSIGNEE_VALUE,
  };

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value ?? '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !canManage) return;

    setFormError('');

    const result = validateClassification(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const changed = {};
      for (const key of Object.keys(initial)) {
        if (form[key] !== initial[key]) {
          changed[key] = form[key];
        }
      }

      const response = await fetch(
        `/api/painel/manifestacoes/${submission.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changed),
        },
      );

      if (response.ok) {
        message.success('Classificação atualizada.');
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

      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label htmlFor={fieldId('status')}>Situação</label>
          <Select
            id={fieldId('status')}
            disabled={!canManage}
            value={form.status}
            onChange={(value) => updateField('status', value)}
            options={SUBMISSION_STATUSES}
            style={{ width: '100%' }}
            status={errors.status ? 'error' : undefined}
          />
        </div>

        <div>
          <label htmlFor={fieldId('priority')}>Prioridade</label>
          <Select
            id={fieldId('priority')}
            disabled={!canManage}
            value={form.priority}
            onChange={(value) => updateField('priority', value)}
            options={SUBMISSION_PRIORITIES}
            style={{ width: '100%' }}
            status={errors.priority ? 'error' : undefined}
          />
        </div>

        <div>
          <label htmlFor={fieldId('categoryId')}>Categoria</label>
          <Select
            id={fieldId('categoryId')}
            disabled={!canManage}
            value={form.categoryId}
            onChange={(value) => updateField('categoryId', value)}
            options={[
              { value: NO_CATEGORY_VALUE, label: 'Sem categoria' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            style={{ width: '100%' }}
            status={errors.categoryId ? 'error' : undefined}
          />
        </div>

        <div>
          <label htmlFor={fieldId('assignedTo')}>Responsável</label>
          <Select
            id={fieldId('assignedTo')}
            disabled={!canManage}
            value={form.assignedTo}
            onChange={(value) => updateField('assignedTo', value)}
            options={[
              { value: NO_ASSIGNEE_VALUE, label: 'Sem responsável' },
              ...assignees.map((assignee) => ({
                value: assignee.id,
                label: assignee.name,
              })),
            ]}
            style={{ width: '100%' }}
            status={errors.assignedTo ? 'error' : undefined}
          />
        </div>

        {canManage && (
          <Button type="primary" htmlType="submit" loading={submitting}>
            Salvar classificação
          </Button>
        )}
      </div>
    </form>
  );
}
