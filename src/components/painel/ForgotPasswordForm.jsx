'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { Aviso, Botao, Campo } from '@/components/auth/AuthUI';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import { validateForgotPasswordInput } from '@/lib/auth/schema';
import styles from './forgot-password-form.module.css';

const INITIAL_FORM = { email: '' };

const GENERIC_ERROR =
  'Não foi possível concluir o pedido agora. Tente novamente em instantes.';

/**
 * Formulário de recuperação de senha.
 *
 * A API sempre responde 200, mesmo quando o e-mail não existe: assim ninguém
 * descobre por aqui quais e-mails estão cadastrados. Por isso o sucesso vira
 * uma confirmação neutra com a mensagem que a própria API devolve, em vez de
 * um texto fixo escrito no cliente.
 */
export default function ForgotPasswordForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const result = validateForgotPasswordInput(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const body = await response.json().catch(() => null);

      if (response.ok) {
        setSuccessMessage(body?.message ?? '');
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

  if (successMessage) {
    return (
      <div className={styles.confirmation}>
        <Aviso tipo="success" role="status">
          {successMessage}
        </Aviso>
        <Link href={LOGIN_PATH} className={styles.backLink}>
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && <Aviso>{formError}</Aviso>}

      <Campo
        id={fieldId('email')}
        label="E-mail"
        type="email"
        autoComplete="username"
        autoFocus
        value={form.email}
        error={errors.email}
        errorId={errorId('email')}
        onChange={(event) => updateField('email', event.target.value)}
      />

      <Botao carregando={submitting}>Enviar link de recuperação</Botao>

      <Link href={LOGIN_PATH} className={styles.backLink}>
        Voltar para o login
      </Link>
    </form>
  );
}
