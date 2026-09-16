'use client';

import { Alert, Button, Input } from 'antd';
import Link from 'next/link';
import { useId, useState } from 'react';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password-rules';
import { validateAcceptInvite } from '@/lib/team/schema';

const GENERIC_ERROR =
  'Não foi possível concluir agora. Tente novamente em instantes.';

const INVALID_INVITE_ERROR =
  'Este convite não é mais válido. Peça um novo convite a quem administra o painel.';

const INITIAL_PASSWORDS = { password: '', passwordConfirmation: '' };

/**
 * Tela pública de aceite de convite: a pessoa ainda não tem sessão, então
 * nada aqui pressupõe o contexto do painel além do antd.
 */
export default function AcceptInviteForm({ token, invite }) {
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteInvalid, setInviteInvalid] = useState(!invite);

  function updateField(name, value) {
    setPasswords((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const result = validateAcceptInvite({ token, ...passwords });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/convite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (response.ok) {
        setSuccess(true);
        return;
      }

      const body = await response.json().catch(() => null);
      const error = body?.error;

      if (response.status === 400 && error?.code === 'invalid_token') {
        setInviteInvalid(true);
        return;
      }

      if (response.status === 400 && error?.details) {
        setErrors(error.details);
      }

      setPasswords(INITIAL_PASSWORDS);
      setFormError(error?.message ?? GENERIC_ERROR);
    } catch {
      setPasswords(INITIAL_PASSWORDS);
      setFormError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (inviteInvalid) {
    return (
      <Alert
        type="error"
        message={INVALID_INVITE_ERROR}
        showIcon
        role="alert"
      />
    );
  }

  if (success) {
    return (
      <div>
        <Alert
          type="success"
          message="Sua conta foi ativada."
          showIcon
          role="status"
          style={{ marginBottom: 16 }}
        />
        <Link href={LOGIN_PATH}>Entrar no painel</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p>Olá, {invite.name}. Defina sua senha para ativar o acesso.</p>

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
          <label htmlFor={fieldId('email')}>E-mail</label>
          <Input id={fieldId('email')} value={invite.email} readOnly disabled />
        </div>

        <div>
          <label htmlFor={fieldId('password')}>Senha</label>
          <Input.Password
            id={fieldId('password')}
            autoComplete="new-password"
            value={passwords.password}
            onChange={(event) => updateField('password', event.target.value)}
            status={errors.password ? 'error' : undefined}
            aria-describedby={
              errors.password
                ? `${fieldId('password')}-hint ${fieldId('password')}-error`
                : `${fieldId('password')}-hint`
            }
            aria-invalid={errors.password ? 'true' : undefined}
          />
          <p id={`${fieldId('password')}-hint`}>
            Use ao menos {PASSWORD_MIN_LENGTH} caracteres.
          </p>
          {errors.password && (
            <p id={`${fieldId('password')}-error`} role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('passwordConfirmation')}>
            Confirme a senha
          </label>
          <Input.Password
            id={fieldId('passwordConfirmation')}
            autoComplete="new-password"
            value={passwords.passwordConfirmation}
            onChange={(event) =>
              updateField('passwordConfirmation', event.target.value)
            }
            status={errors.passwordConfirmation ? 'error' : undefined}
            aria-describedby={
              errors.passwordConfirmation
                ? `${fieldId('passwordConfirmation')}-error`
                : undefined
            }
            aria-invalid={errors.passwordConfirmation ? 'true' : undefined}
          />
          {errors.passwordConfirmation && (
            <p id={`${fieldId('passwordConfirmation')}-error`} role="alert">
              {errors.passwordConfirmation}
            </p>
          )}
        </div>

        <Button type="primary" htmlType="submit" loading={submitting}>
          Ativar acesso
        </Button>
      </div>
    </form>
  );
}
