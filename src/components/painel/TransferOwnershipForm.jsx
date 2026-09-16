'use client';

import { Alert, App, Button, Checkbox, Select } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { validateTransferOwnership } from '@/lib/team/schema';

const GENERIC_ERROR =
  'Não foi possível transferir agora. Tente novamente em instantes.';

const INITIAL_FORM = { userId: '', confirmation: false };

/**
 * Transferência do papel de responsável. É de mão única na prática: quem
 * transfere vira administrador e só o novo responsável pode devolver — por
 * isso a confirmação explícita é obrigatória, e não decorativa.
 */
export default function TransferOwnershipForm({ members, currentUserId }) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const candidates = members.filter(
    (member) => member.access === 'active' && member.id !== currentUserId,
  );

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (candidates.length === 0) {
    return (
      <Alert
        type="info"
        showIcon
        message="Nenhum integrante disponível para receber a transferência."
        description="Só pode receber o papel de responsável quem já tem acesso ativo (senha definida e conta ativada). Convide alguém ou espere um convite pendente ser aceito."
      />
    );
  }

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const result = validateTransferOwnership(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/painel/equipe/transferir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (response.ok) {
        message.success('Responsável transferido.');
        setForm(INITIAL_FORM);
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
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Esta ação não se desfaz sozinha"
        description="Ao transferir, você deixa de ser responsável e passa a administrador. Só quem receber o papel de responsável pode devolvê-lo depois."
      />

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
          <label htmlFor={fieldId('userId')}>Novo responsável</label>
          <Select
            id={fieldId('userId')}
            value={form.userId || undefined}
            placeholder="Escolha um integrante"
            onChange={(value) => updateField('userId', value)}
            options={candidates.map((member) => ({
              value: member.id,
              label: `${member.name} (${member.email})`,
            }))}
            style={{ width: '100%' }}
            status={errors.userId ? 'error' : undefined}
          />
          {errors.userId && <p role="alert">{errors.userId}</p>}
        </div>

        <div>
          <Checkbox
            id={fieldId('confirmation')}
            checked={form.confirmation}
            onChange={(event) =>
              updateField('confirmation', event.target.checked)
            }
          >
            Entendo que vou deixar de ser responsável e virar administrador, e
            que essa ação não pode ser desfeita por mim.
          </Checkbox>
          {errors.confirmation && <p role="alert">{errors.confirmation}</p>}
        </div>

        <Button type="primary" danger htmlType="submit" loading={submitting}>
          Transferir responsabilidade
        </Button>
      </div>
    </form>
  );
}
