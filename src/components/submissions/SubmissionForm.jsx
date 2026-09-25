'use client';

import { useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { SUBMISSION_TYPES } from '@/lib/submissions/constants';
import { validateSubmissionInput } from '@/lib/submissions/schema';
import SubmissionSuccess from './SubmissionSuccess';
import styles from './submission-form.module.css';

const DESCRIPTION_MAX = 5000;

const INITIAL_FORM = {
  type: '',
  categoryId: '',
  title: '',
  description: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  consent: false,
};

/**
 * Formulário público do canal de manifestações.
 *
 * Valida no cliente com o mesmo schema usado pela API (validateSubmissionInput),
 * envia para POST /api/submissions e troca de lugar com <SubmissionSuccess>
 * assim que a API confirma o registro.
 */
export default function SubmissionForm({ categories = [], consentText }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);

  const errorSummaryRef = useRef(null);
  const uid = useId();

  const fieldId = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function focusErrorSummary() {
    // Aguarda o resumo aparecer no DOM antes de mover o foco.
    requestAnimationFrame(() => {
      errorSummaryRef.current?.focus();
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const payload = {
      type: form.type,
      categoryId: form.categoryId || '',
      title: form.title,
      description: form.description,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      consent: form.consent,
    };

    const result = validateSubmissionInput(payload);
    if (!result.success) {
      setErrors(result.errors);
      focusErrorSummary();
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const body = await response.json();
        setSubmission(body.submission);
        toast.success('Manifestação enviada com sucesso.');
        return;
      }

      if (response.status === 400) {
        const body = await response.json();
        const details = body?.error?.details ?? {};
        setErrors(details);
        setFormError(
          body?.error?.message ?? 'Verifique os campos destacados abaixo.',
        );
        focusErrorSummary();
        return;
      }

      if (response.status === 429) {
        const body = await response.json();
        const seconds = body?.error?.retryAfterSeconds;
        const message = seconds
          ? `Muitas tentativas. Tente novamente em ${seconds} segundos.`
          : 'Muitas tentativas. Tente novamente em instantes.';
        setFormError(message);
        toast.error(message);
        focusErrorSummary();
        return;
      }

      const message =
        'Não foi possível enviar sua manifestação agora. Tente novamente em instantes.';
      setFormError(message);
      toast.error(message);
      focusErrorSummary();
    } catch {
      const message =
        'Não foi possível enviar sua manifestação agora. Tente novamente em instantes.';
      setFormError(message);
      toast.error(message);
      focusErrorSummary();
    } finally {
      setSubmitting(false);
    }
  }

  if (submission) {
    return <SubmissionSuccess submission={submission} />;
  }

  const errorEntries = Object.entries(errors);
  const descriptionLength = form.description.length;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {(formError || errorEntries.length > 0) && (
        <div
          ref={errorSummaryRef}
          className={styles.errorSummary}
          role="alert"
          tabIndex={-1}
        >
          <p className={styles.errorSummaryTitle}>
            {formError || 'Corrija os campos indicados antes de enviar.'}
          </p>
          {errorEntries.length > 0 && (
            <ul className={styles.errorSummaryList}>
              {errorEntries.map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Tipo de manifestação</legend>
        <div className={styles.radioGroup}>
          {SUBMISSION_TYPES.map((option) => (
            <label key={option.value} className={styles.radioOption}>
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={form.type === option.value}
                onChange={(event) => updateField('type', event.target.value)}
                aria-describedby={errors.type ? errorId('type') : undefined}
                aria-invalid={errors.type ? 'true' : undefined}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.type && (
          <p id={errorId('type')} className={styles.fieldError}>
            {errors.type}
          </p>
        )}
      </fieldset>

      {categories.length > 0 && (
        <div className={styles.field}>
          <label htmlFor={fieldId('categoryId')} className={styles.label}>
            Categoria (opcional)
          </label>
          <select
            id={fieldId('categoryId')}
            className={styles.select}
            value={form.categoryId}
            onChange={(event) => updateField('categoryId', event.target.value)}
            aria-describedby={
              errors.categoryId ? errorId('categoryId') : undefined
            }
            aria-invalid={errors.categoryId ? 'true' : undefined}
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p id={errorId('categoryId')} className={styles.fieldError}>
              {errors.categoryId}
            </p>
          )}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor={fieldId('title')} className={styles.label}>
          Assunto
        </label>
        <input
          id={fieldId('title')}
          type="text"
          className={styles.input}
          value={form.title}
          maxLength={150}
          onChange={(event) => updateField('title', event.target.value)}
          aria-describedby={errors.title ? errorId('title') : undefined}
          aria-invalid={errors.title ? 'true' : undefined}
        />
        {errors.title && (
          <p id={errorId('title')} className={styles.fieldError}>
            {errors.title}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('description')} className={styles.label}>
          Descrição
        </label>
        <textarea
          id={fieldId('description')}
          className={styles.textarea}
          value={form.description}
          maxLength={DESCRIPTION_MAX}
          rows={6}
          onChange={(event) => updateField('description', event.target.value)}
          aria-describedby={`${fieldId('description')}-counter${
            errors.description ? ` ${errorId('description')}` : ''
          }`}
          aria-invalid={errors.description ? 'true' : undefined}
        />
        <p id={`${fieldId('description')}-counter`} className={styles.counter}>
          {descriptionLength}/{DESCRIPTION_MAX} caracteres
        </p>
        {errors.description && (
          <p id={errorId('description')} className={styles.fieldError}>
            {errors.description}
          </p>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={fieldId('contactName')} className={styles.label}>
            Nome (opcional)
          </label>
          <input
            id={fieldId('contactName')}
            type="text"
            className={styles.input}
            value={form.contactName}
            maxLength={120}
            onChange={(event) => updateField('contactName', event.target.value)}
            aria-describedby={
              errors.contactName ? errorId('contactName') : undefined
            }
            aria-invalid={errors.contactName ? 'true' : undefined}
          />
          {errors.contactName && (
            <p id={errorId('contactName')} className={styles.fieldError}>
              {errors.contactName}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId('contactEmail')} className={styles.label}>
            E-mail
          </label>
          <input
            id={fieldId('contactEmail')}
            type="email"
            className={styles.input}
            value={form.contactEmail}
            onChange={(event) =>
              updateField('contactEmail', event.target.value)
            }
            aria-describedby={
              errors.contactEmail ? errorId('contactEmail') : undefined
            }
            aria-invalid={errors.contactEmail ? 'true' : undefined}
          />
          {errors.contactEmail && (
            <p id={errorId('contactEmail')} className={styles.fieldError}>
              {errors.contactEmail}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId('contactPhone')} className={styles.label}>
            Telefone
          </label>
          <input
            id={fieldId('contactPhone')}
            type="tel"
            className={styles.input}
            value={form.contactPhone}
            maxLength={30}
            onChange={(event) =>
              updateField('contactPhone', event.target.value)
            }
            aria-describedby={
              errors.contactPhone ? errorId('contactPhone') : undefined
            }
            aria-invalid={errors.contactPhone ? 'true' : undefined}
          />
          {errors.contactPhone && (
            <p id={errorId('contactPhone')} className={styles.fieldError}>
              {errors.contactPhone}
            </p>
          )}
        </div>
      </div>

      <p className={styles.hint}>
        Informe ao menos um e-mail ou telefone para que possamos responder.
      </p>

      <label className={styles.checkboxOption}>
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => updateField('consent', event.target.checked)}
          aria-describedby={errors.consent ? errorId('consent') : undefined}
          aria-invalid={errors.consent ? 'true' : undefined}
        />
        <span>
          {consentText ??
            'Concordo com o uso dos meus dados para o atendimento desta manifestação.'}
        </span>
      </label>
      {errors.consent && (
        <p id={errorId('consent')} className={styles.fieldError}>
          {errors.consent}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        aria-busy={submitting || undefined}
      >
        {submitting ? 'Enviando…' : 'Enviar manifestação'}
      </Button>
    </form>
  );
}
