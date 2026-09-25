'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { Aviso, Botao, CampoSenha } from '@/components/auth/AuthUI';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password-rules';
import styles from './reset-password-form.module.css';

/*
 * A validação é baixada sob demanda: ela só roda no envio, e importada no topo
 * ia para o carregamento da página — o zod/mini virou pedaço compartilhado
 * entre os formulários públicos e custava ~24 KB antes da primeira pintura (a
 * tela de convite chegava a levar o zod completo). O download começa quando a
 * pessoa toca no primeiro campo, então no envio ele já chegou.
 */
const carregarValidacao = () => import('@/lib/auth/schema');

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

    const { validateResetPasswordInput } = await carregarValidacao();

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
        <Aviso>{INVALID_TOKEN_ERROR}</Aviso>
        <Link href="/painel/esqueci-senha" className={styles.backLink}>
          Pedir um novo link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.confirmation}>
        <Aviso tipo="success" role="status">
          Sua senha foi redefinida.
        </Aviso>
        <Link href={LOGIN_PATH} className={styles.backLink}>
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form
      onFocusCapture={carregarValidacao}
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      {formError && <Aviso>{formError}</Aviso>}

      <CampoSenha
        id={fieldId('password')}
        label="Nova senha"
        autoComplete="new-password"
        value={passwords.password}
        error={errors.password}
        errorId={errorId('password')}
        dica={`Use ao menos ${PASSWORD_MIN_LENGTH} caracteres.`}
        dicaId={hintId}
        onChange={(event) => updateField('password', event.target.value)}
      />

      <CampoSenha
        id={fieldId('passwordConfirmation')}
        label="Confirme a nova senha"
        autoComplete="new-password"
        value={passwords.passwordConfirmation}
        error={errors.passwordConfirmation}
        errorId={errorId('passwordConfirmation')}
        onChange={(event) =>
          updateField('passwordConfirmation', event.target.value)
        }
      />

      <Botao carregando={submitting}>Redefinir senha</Botao>
    </form>
  );
}
