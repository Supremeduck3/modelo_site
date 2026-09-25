'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Aviso, Botao, Campo, CampoSenha } from '@/components/auth/AuthUI';
import { FORGOT_PASSWORD_PATH } from '@/lib/auth/next-path';
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

      <CampoSenha
        id={fieldId('password')}
        label="Senha"
        autoComplete="current-password"
        value={form.password}
        error={errors.password}
        errorId={errorId('password')}
        onChange={(event) => updateField('password', event.target.value)}
      />

      <Botao carregando={submitting}>Entrar</Botao>

      <p className={styles.helper}>
        <Link href={FORGOT_PASSWORD_PATH}>Esqueci minha senha</Link>
      </p>
    </form>
  );
}
