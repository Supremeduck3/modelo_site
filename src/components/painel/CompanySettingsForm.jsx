'use client';

import { Alert, App, Button, Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import {
  MAX_BUSINESS_HOURS,
  validateCompanySettings,
} from '@/lib/company/schema';

const { TextArea } = Input;

const GENERIC_ERROR = 'Não foi possível salvar agora. Tente novamente.';

function toFormState(company) {
  return {
    name: company?.name ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
    website: company?.website ?? '',
    description: company?.description ?? '',
    segment: company?.segment ?? '',
    city: company?.city ?? '',
    state: company?.state ?? '',
    // `businessHours` sai de uma coluna Json: o servidor normaliza, e aqui
    // conferimos de novo porque uma tela não pode quebrar por dado legado.
    businessHours:
      Array.isArray(company?.businessHours) && company.businessHours.length > 0
        ? company.businessHours.map((row, index) => ({
            rowId: `initial-${index}`,
            days: String(row?.days ?? ''),
            hours: String(row?.hours ?? ''),
          }))
        : [{ rowId: 'initial-0', days: '', hours: '' }],
  };
}

/**
 * Dados operacionais da empresa: os que ela usa no dia a dia, presentes nos
 * e-mails enviados ao visitante e no cabeçalho do painel. O que o site
 * público mostra vem da configuração da implantação, feita por quem
 * implantou — esta tela não altera isso.
 */
export default function CompanySettingsForm({
  company,
  siteIdentityName,
  canManage,
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;
  const rowCounter = useRef(0);

  const [form, setForm] = useState(() => toFormState(company));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nameDiverges =
    Boolean(siteIdentityName) &&
    siteIdentityName.trim() !== (company?.name ?? '').trim();

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value ?? '' }));
  }

  function updateHour(index, field, value) {
    setForm((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    }));
  }

  function addHourRow() {
    setForm((prev) => {
      if (prev.businessHours.length >= MAX_BUSINESS_HOURS) return prev;
      rowCounter.current += 1;
      return {
        ...prev,
        businessHours: [
          ...prev.businessHours,
          { rowId: `new-${rowCounter.current}`, days: '', hours: '' },
        ],
      };
    });
  }

  function removeHourRow(index) {
    setForm((prev) => ({
      ...prev,
      businessHours: prev.businessHours.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !canManage) return;

    setFormError('');

    const payload = {
      ...form,
      businessHours: form.businessHours
        .filter(
          (row) =>
            String(row.days ?? '').trim() !== '' ||
            String(row.hours ?? '').trim() !== '',
        )
        .map(({ days, hours }) => ({ days, hours })),
    };

    const result = validateCompanySettings(payload);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/painel/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (response.ok) {
        message.success('Dados da empresa atualizados.');
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
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

  // `disabled` tira o campo da ordem de tabulação e, em vários leitores de
  // tela, do modo de leitura: quem não administra não conseguiria nem ler os
  // dados pelo teclado. Só leitura usa `readOnly`.
  const readOnly = !canManage;
  const disabled = submitting;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert
        type="info"
        showIcon
        message="Estes são os dados que a empresa usa na operação"
        description="Eles aparecem nos e-mails enviados ao visitante e no painel. O que o site público mostra vem da configuração da implantação, definida por quem implantou o site, e não muda por aqui."
        style={{ marginBottom: 16 }}
      />

      {readOnly && (
        <Alert
          type="info"
          showIcon
          message="Somente quem administra o painel pode alterar estes dados."
          description="Você pode consultá-los à vontade; as alterações ficam com o responsável ou um administrador."
          style={{ marginBottom: 16 }}
        />
      )}

      {nameDiverges && (
        <Alert
          type="warning"
          showIcon
          message="O nome exibido no site público é diferente do nome usado nos e-mails"
          description={`O site público exibe "${siteIdentityName}", enquanto os e-mails e o painel usam "${company?.name ?? ''}". Isso não é corrigido automaticamente: ajuste o que for necessário no lugar certo.`}
          style={{ marginBottom: 16 }}
        />
      )}

      {formError && (
        <Alert
          type="error"
          message={formError}
          showIcon
          role="alert"
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <div>
          <label htmlFor={fieldId('name')}>Nome da empresa</label>
          <Input
            id={fieldId('name')}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
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
            disabled={disabled}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
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
          <label htmlFor={fieldId('phone')}>Telefone</label>
          <Input
            id={fieldId('phone')}
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
            status={errors.phone ? 'error' : undefined}
            aria-describedby={
              errors.phone ? `${fieldId('phone')}-error` : undefined
            }
            aria-invalid={errors.phone ? 'true' : undefined}
          />
          {errors.phone && (
            <p id={`${fieldId('phone')}-error`} role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('website')}>Site</label>
          <Input
            id={fieldId('website')}
            value={form.website}
            onChange={(event) => updateField('website', event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
            placeholder="https://"
            status={errors.website ? 'error' : undefined}
            aria-describedby={
              errors.website ? `${fieldId('website')}-error` : undefined
            }
            aria-invalid={errors.website ? 'true' : undefined}
          />
          {errors.website && (
            <p id={`${fieldId('website')}-error`} role="alert">
              {errors.website}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('description')}>Descrição</label>
          <TextArea
            id={fieldId('description')}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
            rows={4}
            status={errors.description ? 'error' : undefined}
            aria-describedby={
              errors.description ? `${fieldId('description')}-error` : undefined
            }
            aria-invalid={errors.description ? 'true' : undefined}
          />
          {errors.description && (
            <p id={`${fieldId('description')}-error`} role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('segment')}>Segmento</label>
          <Input
            id={fieldId('segment')}
            value={form.segment}
            onChange={(event) => updateField('segment', event.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
            status={errors.segment ? 'error' : undefined}
            aria-describedby={
              errors.segment ? `${fieldId('segment')}-error` : undefined
            }
            aria-invalid={errors.segment ? 'true' : undefined}
          />
          {errors.segment && (
            <p id={`${fieldId('segment')}-error`} role="alert">
              {errors.segment}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label htmlFor={fieldId('city')}>Cidade</label>
            <Input
              id={fieldId('city')}
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              disabled={disabled}
              readOnly={readOnly}
              aria-disabled={readOnly || undefined}
              status={errors.city ? 'error' : undefined}
              aria-describedby={
                errors.city ? `${fieldId('city')}-error` : undefined
              }
              aria-invalid={errors.city ? 'true' : undefined}
            />
            {errors.city && (
              <p id={`${fieldId('city')}-error`} role="alert">
                {errors.city}
              </p>
            )}
          </div>

          <div style={{ flex: '0 1 120px' }}>
            <label htmlFor={fieldId('state')}>Estado (UF)</label>
            <Input
              id={fieldId('state')}
              value={form.state}
              onChange={(event) =>
                updateField('state', event.target.value.toUpperCase())
              }
              disabled={disabled}
              readOnly={readOnly}
              aria-disabled={readOnly || undefined}
              maxLength={2}
              status={errors.state ? 'error' : undefined}
              aria-describedby={
                errors.state ? `${fieldId('state')}-error` : undefined
              }
              aria-invalid={errors.state ? 'true' : undefined}
            />
            {errors.state && (
              <p id={`${fieldId('state')}-error`} role="alert">
                {errors.state}
              </p>
            )}
          </div>
        </div>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ marginBottom: 8 }}>Horários de atendimento</legend>

          <div style={{ display: 'grid', gap: 8 }}>
            {form.businessHours.map((row, index) => (
              <div
                key={row.rowId}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                <Input
                  aria-label={`Dias da faixa ${index + 1}`}
                  placeholder="Dias (ex.: Seg a sex)"
                  value={row.days}
                  onChange={(event) =>
                    updateHour(index, 'days', event.target.value)
                  }
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-disabled={readOnly || undefined}
                  style={{ flex: '1 1 200px' }}
                />
                <Input
                  aria-label={`Horário da faixa ${index + 1}`}
                  placeholder="Horário (ex.: 9h às 18h)"
                  value={row.hours}
                  onChange={(event) =>
                    updateHour(index, 'hours', event.target.value)
                  }
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-disabled={readOnly || undefined}
                  style={{ flex: '1 1 200px' }}
                />
                {!disabled && form.businessHours.length > 1 && (
                  <Button
                    onClick={() => removeHourRow(index)}
                    aria-label={`Remover faixa ${index + 1}`}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}
          </div>

          {errors.businessHours && <p role="alert">{errors.businessHours}</p>}

          {!readOnly && form.businessHours.length < MAX_BUSINESS_HOURS && (
            <Button style={{ marginTop: 8 }} onClick={addHourRow}>
              Adicionar faixa de horário
            </Button>
          )}
        </fieldset>

        {canManage && (
          <Button type="primary" htmlType="submit" loading={submitting}>
            Salvar
          </Button>
        )}
      </div>
    </form>
  );
}
