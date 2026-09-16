'use client';

import { Alert, Button, Input } from 'antd';
import Link from 'next/link';
import { useId, useState } from 'react';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password-rules';
import { validateResetPasswordInput } from '@/lib/auth/schema';
import styles from './reset-password-form.module.css';

const INITIAL_PASSWORDS = { password: '', passwordConfirmation: '' };

const GENERIC_ERROR =
  'Não foi possível redefinir sua senha agora. Tente novamente em instantes.';

const INVALID_TOKEN_ERROR =
  'Este link de recuperação não é mais válido. Peça um novo link para continuar.';

/**
 * Formulário de definição de nova senha a partir do link de recuperação.
 *
 * Sem token na URL não há o que enviar: mostramos direto o estado de link
 * inválido, com um caminho para pedir outro, em vez de deixar o visitante
 * preencher campos que a API vai recusar de qualquer jeito.
 */
export default function ResetPasswordForm({ token }) {
  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(!token);

  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;
  const hintId = fieldId('password-hint');

  function updateField(name, value) {
    setPasswords((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const result = validateResetPasswordInput({ token, ...passwords });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...passwords }),
      });

      if (response.ok) {
        setSuccess(true);
        return;
      }

      const body = await response.json().catch(() => null);
      const error = body?.error;

      if (response.status === 400 && error?.code === 'invalid_token') {
        setTokenInvalid(true);
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

  if (tokenInvalid) {
    return (
      <div className={styles.confirmation}>
        <Alert
          type="error"
          message={INVALID_TOKEN_ERROR}
          showIcon
          role="alert"
        />
        <Link href="/painel/esqueci-senha" className={styles.backLink}>
          Pedir um novo link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.confirmation}>
        <Alert
          type="success"
          message="Sua senha foi redefinida."
          showIcon
          role="status"
        />
        <Link href={LOGIN_PATH} className={styles.backLink}>
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <Alert type="error" message={formError} showIcon role="alert" />
      )}

      <div className={styles.field}>
        <label htmlFor={fieldId('password')} className={styles.label}>
          Nova senha
        </label>
        <Input.Password
          id={fieldId('password')}
          size="large"
          autoComplete="new-password"
          value={passwords.password}
          status={errors.password ? 'error' : undefined}
          onChange={(event) => updateField('password', event.target.value)}
          aria-describedby={
            errors.password ? `${hintId} ${errorId('password')}` : hintId
          }
          aria-invalid={errors.password ? 'true' : undefined}
        />
        <p id={hintId} className={styles.fieldHint}>
          Use ao menos {PASSWORD_MIN_LENGTH} caracteres.
        </p>
        {errors.password && (
          <p id={errorId('password')} className={styles.fieldError}>
            {errors.password}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label
          htmlFor={fieldId('passwordConfirmation')}
          className={styles.label}
        >
          Confirme a nova senha
        </label>
        <Input.Password
          id={fieldId('passwordConfirmation')}
          size="large"
          autoComplete="new-password"
          value={passwords.passwordConfirmation}
          status={errors.passwordConfirmation ? 'error' : undefined}
          onChange={(event) =>
            updateField('passwordConfirmation', event.target.value)
          }
          aria-describedby={
            errors.passwordConfirmation
              ? errorId('passwordConfirmation')
              : undefined
          }
          aria-invalid={errors.passwordConfirmation ? 'true' : undefined}
        />
        {errors.passwordConfirmation && (
          <p id={errorId('passwordConfirmation')} className={styles.fieldError}>
            {errors.passwordConfirmation}
          </p>
        )}
      </div>

      <Button
        type="primary"
        size="large"
        htmlType="submit"
        loading={submitting}
        block
      >
        Redefinir senha
      </Button>
    </form>
  );
}
