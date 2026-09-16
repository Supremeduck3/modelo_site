'use client';

import { Alert, App, Button, Input, Modal, Select, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { roleLabel } from '@/lib/auth/constants';
import { ASSIGNABLE_ROLES, validateInviteMember } from '@/lib/team/schema';

const { Paragraph } = Typography;

const GENERIC_ERROR =
  'Não foi possível enviar o convite agora. Tente novamente em instantes.';

const DEFAULT_ROLE = 'operator';

const INITIAL_FORM = { name: '', email: '', role: DEFAULT_ROLE };

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((value) => ({
  value,
  label: roleLabel(value),
}));

/**
 * Convite de novo integrante. O link só existe uma vez, na resposta desta
 * chamada: por isso é exibido de imediato num modal, nunca guardado, nunca
 * logado.
 */
export default function InviteMemberForm() {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [link, setLink] = useState(null);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value ?? '' }));
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(link);
      message.success('Link copiado.');
    } catch {
      message.error('Não foi possível copiar. Selecione e copie manualmente.');
    }
  }

  function closeModal() {
    setLink(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const result = validateInviteMember(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/painel/equipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const body = await response.json().catch(() => null);

      if (response.status === 201) {
        setLink(body?.link ?? null);
        setForm(INITIAL_FORM);
        router.refresh();
        return;
      }

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
    <>
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
            <label htmlFor={fieldId('name')}>Nome</label>
            <Input
              id={fieldId('name')}
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              status={errors.name ? 'error' : undefined}
              aria-describedby={
                errors.name ? `${fieldId('name')}-error` : undefined
              }
              aria-invalid={errors.name ? 'true' : undefined}
            />
            {errors.name && (
              <p id={`${fieldId('name')}-error`} role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={fieldId('email')}>E-mail</label>
            <Input
              id={fieldId('email')}
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              status={errors.email ? 'error' : undefined}
              aria-describedby={
                errors.email ? `${fieldId('email')}-error` : undefined
              }
              aria-invalid={errors.email ? 'true' : undefined}
            />
            {errors.email && (
              <p id={`${fieldId('email')}-error`} role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={fieldId('role')}>Perfil</label>
            <Select
              id={fieldId('role')}
              value={form.role}
              onChange={(value) => updateField('role', value)}
              options={ROLE_OPTIONS}
              style={{ width: '100%' }}
              status={errors.role ? 'error' : undefined}
            />
            {errors.role && <p role="alert">{errors.role}</p>}
          </div>

          <Button type="primary" htmlType="submit" loading={submitting}>
            Enviar convite
          </Button>
        </div>
      </form>

      <Modal
        open={Boolean(link)}
        title="Convite criado"
        onCancel={closeModal}
        footer={[
          <Button key="close" onClick={closeModal}>
            Fechar
          </Button>,
        ]}
      >
        <Paragraph>
          Este link aparece uma única vez. Ele leva a pessoa a definir a própria
          senha e ativar o acesso — se há e-mail configurado, ele também foi
          enviado automaticamente.
        </Paragraph>
        <Input.Group compact style={{ display: 'flex' }}>
          <Input readOnly value={link ?? ''} aria-label="Link de convite" />
          <Button onClick={handleCopyLink}>Copiar</Button>
        </Input.Group>
      </Modal>
    </>
  );
}
