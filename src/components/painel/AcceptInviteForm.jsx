'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { Aviso, Botao, Campo, CampoSenha } from '@/components/auth/AuthUI';
import styles from '@/components/auth/auth-ui.module.css';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/password-rules';

/*
 * A validação é baixada sob demanda: ela só roda no envio, e importada no topo
 * ia para o carregamento da página — o zod/mini virou pedaço compartilhado
 * entre os formulários públicos e custava ~24 KB antes da primeira pintura (a
 * tela de convite chegava a levar o zod completo). O download começa quando a
 * pessoa toca no primeiro campo, então no envio ele já chegou.
 */
const carregarValidacao = () => import('@/lib/team/schema');

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

    const { validateAcceptInvite } = await carregarValidacao();

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
    return <Aviso>{INVALID_INVITE_ERROR}</Aviso>;
  }

  if (success) {
    return (
      <div className={styles.confirmation}>
        <Aviso tipo="success" role="status">
          Sua conta foi ativada.
        </Aviso>
        <Link href={LOGIN_PATH}>Entrar no painel</Link>
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
      <p className={styles.intro}>
        Olá, {invite.name}. Defina sua senha para ativar o acesso.
      </p>

      {formError && <Aviso>{formError}</Aviso>}

      {/*
        O e-mail vem do convite e não se edita: é ele que identifica a conta
        sendo ativada. Aparece porque quem recebeu o link precisa conferir que
        é o próprio endereço.
      */}
      <Campo
        id={fieldId('email')}
        label="E-mail"
        value={invite.email}
        readOnly
        disabled
      />

      <CampoSenha
        id={fieldId('password')}
        label="Senha"
        autoComplete="new-password"
        value={passwords.password}
        error={errors.password}
        errorId={`${fieldId('password')}-error`}
        dica={`Use ao menos ${PASSWORD_MIN_LENGTH} caracteres.`}
        dicaId={`${fieldId('password')}-hint`}
        onChange={(event) => updateField('password', event.target.value)}
      />

      <CampoSenha
        id={fieldId('passwordConfirmation')}
        label="Confirme a senha"
        autoComplete="new-password"
        value={passwords.passwordConfirmation}
        error={errors.passwordConfirmation}
        errorId={`${fieldId('passwordConfirmation')}-error`}
        onChange={(event) =>
          updateField('passwordConfirmation', event.target.value)
        }
      />

      <Botao carregando={submitting}>Ativar acesso</Botao>
    </form>
  );
}
