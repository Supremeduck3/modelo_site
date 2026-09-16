'use client';

import { Alert, Button, Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { validateLoginInput } from '@/lib/auth/schema';
import styles from './login-form.module.css';

const INITIAL_FORM = { email: '', password: '' };

const GENERIC_ERROR =
  'Não foi possível entrar agora. Tente novamente em instantes.';

/**
 * Formulário de entrada no painel.
 *
 * Valida no cliente com o mesmo schema da API só para dar retorno rápido; quem
 * decide é sempre `POST /api/auth/login`. Em caso de sucesso a sessão já veio
 * no cookie httpOnly — o `refresh()` faz o servidor reavaliar a guarda do
 * painel com ela.
 */
export default function LoginForm({ nextPath }) {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    const result = validateLoginInput(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        // `replace` para o login não ficar no histórico: voltar depois de entrar
        // levaria a uma tela que só redireciona de novo.
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      const error = body?.error;

      if (response.status === 400 && error?.details) {
        setErrors(error.details);
      }

      // A senha sai do estado em qualquer falha: assim uma tentativa recusada
      // não fica pendurada no formulário.
      setForm((prev) => ({ ...prev, password: '' }));
      setFormError(error?.message ?? GENERIC_ERROR);
    } catch {
      setForm((prev) => ({ ...prev, password: '' }));
      setFormError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <Alert type="error" message={formError} showIcon role="alert" />
      )}

      <div className={styles.field}>
        <label htmlFor={fieldId('email')} className={styles.label}>
          E-mail
        </label>
        <Input
          id={fieldId('email')}
          type="email"
          size="large"
          autoComplete="username"
          autoFocus
          value={form.email}
          status={errors.email ? 'error' : undefined}
          onChange={(event) => updateField('email', event.target.value)}
          aria-describedby={errors.email ? errorId('email') : undefined}
          aria-invalid={errors.email ? 'true' : undefined}
        />
        {errors.email && (
          <p id={errorId('email')} className={styles.fieldError}>
            {errors.email}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('password')} className={styles.label}>
          Senha
        </label>
        <Input.Password
          id={fieldId('password')}
          size="large"
          autoComplete="current-password"
          value={form.password}
          status={errors.password ? 'error' : undefined}
          onChange={(event) => updateField('password', event.target.value)}
          aria-describedby={errors.password ? errorId('password') : undefined}
          aria-invalid={errors.password ? 'true' : undefined}
        />
        {errors.password && (
          <p id={errorId('password')} className={styles.fieldError}>
            {errors.password}
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
        Entrar
      </Button>
    </form>
  );
}
