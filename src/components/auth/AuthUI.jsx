'use client';

import { useState } from 'react';
import styles from './auth-ui.module.css';

/**
 * Controles das telas públicas de acesso, sem depender do Ant Design.
 *
 * A biblioteca do painel entrava nas quatro telas públicas de acesso só para
 * desenhar campo, aviso e botão, e levava ~220 KB de JavaScript com ela.
 * Aqui o mesmo comportamento sai de HTML nativo estilizado pelos tokens da
 * implantação — inclusive o que o `Input.Password` dava de graça: revelar a
 * senha.
 *
 * O que estes componentes não abrem mão: rótulo ligado ao campo, erro
 * anunciado por `aria-describedby` + `aria-invalid`, e estado nunca
 * comunicado só por cor.
 */

/** Campo de texto com rótulo e erro. */
export function Campo({
  id,
  label,
  error,
  errorId,
  dica = null,
  dicaId,
  acao = null,
  className,
  ...props
}) {
  /*
   * Dica e erro são anunciados juntos quando existem os dois: a dica diz a
   * regra ("ao menos 10 caracteres") e o erro diz o que aconteceu. Deixar só
   * o erro esconderia a regra de quem usa leitor de tela justamente na hora
   * em que ela importa.
   */
  const descrito = [dica ? dicaId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <div className={styles.control}>
        <input
          id={id}
          className={[
            styles.input,
            error ? styles.inputError : '',
            acao ? styles.inputWithAction : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={descrito || undefined}
          {...props}
        />
        {acao}
      </div>

      {dica && (
        <p id={dicaId} className={styles.fieldHint}>
          {dica}
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

function OlhoAberto() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M1.8 12s3.6-7 10.2-7 10.2 7 10.2 7-3.6 7-10.2 7S1.8 12 1.8 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OlhoFechado() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.8 9.8 0 0 1 12 5c6.6 0 10.2 7 10.2 7a17 17 0 0 1-2.6 3.4M6.5 7.1A16.6 16.6 0 0 0 1.8 12s3.6 7 10.2 7c1.6 0 3-.4 4.3-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/**
 * Campo de senha com alternância de visibilidade.
 *
 * O botão fica fora da ordem de tabulação do formulário? Não: é um controle
 * legítimo e recebe foco. O que ele não faz é enviar o formulário — daí o
 * `type="button"` explícito, que é o erro clássico aqui.
 */
export function CampoSenha({ label, ...props }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <Campo
      {...props}
      label={label}
      type={visivel ? 'text' : 'password'}
      acao={
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setVisivel((atual) => !atual)}
          aria-pressed={visivel}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visivel ? <OlhoFechado /> : <OlhoAberto />}
        </button>
      }
    />
  );
}

function IconeErro() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${styles.noticeIcon} ${styles.noticeErrorIcon}`}
      aria-hidden="true"
    >
      <path d="M12 2 1 21h22L12 2Zm0 6 .9 7h-1.8L12 8Zm0 9.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
    </svg>
  );
}

function IconeSucesso() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${styles.noticeIcon} ${styles.noticeSuccessIcon}`}
      aria-hidden="true"
    >
      <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm5.3 8.1-6.2 6.3a1 1 0 0 1-1.4 0L6.7 12.4 8.1 11l2.3 2.3 5.5-5.6 1.4 1.4Z" />
    </svg>
  );
}

/**
 * Aviso do formulário.
 *
 * `tipo` escolhe a aparência; `role` é de quem chama, porque a diferença entre
 * `alert` (interrompe) e `status` (informa) é de significado, não de cor.
 */
export function Aviso({ tipo = 'error', role = 'alert', children }) {
  const sucesso = tipo === 'success';

  return (
    <p
      className={`${styles.notice} ${sucesso ? styles.noticeSuccess : styles.noticeError}`}
      role={role}
    >
      {sucesso ? <IconeSucesso /> : <IconeErro />}
      <span>{children}</span>
    </p>
  );
}

/** Botão de envio, com indicador enquanto a requisição está no ar. */
export function Botao({ children, carregando = false, ...props }) {
  return (
    <button
      type="submit"
      className={styles.button}
      disabled={carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
