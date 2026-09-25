'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import { Aviso, Botao, Campo } from '@/components/auth/AuthUI';
import authStyles from '@/components/auth/auth-ui.module.css';
import { BOOKING_PERIODS, labelOf } from '@/lib/booking/constants';
import {
  dateParts,
  formatDateLong,
  formatDateShort,
} from '@/lib/booking/dates';
import { formatDuration, formatPrice } from '@/lib/catalog/format';
import { whatsappLink } from '@/lib/whatsapp';
import styles from './booking-form.module.css';

/*
 * A validação é baixada sob demanda: ela só roda no envio, e importada no topo
 * ia para o carregamento da página — o zod/mini virou pedaço compartilhado
 * entre os formulários públicos e custava ~24 KB antes da primeira pintura (a
 * tela de convite chegava a levar o zod completo). O download começa quando a
 * pessoa toca no primeiro campo, então no envio ele já chegou.
 */
const carregarValidacao = () => import('@/lib/booking/schema');

const GENERIC_ERROR =
  'Não foi possível enviar agora. Tente de novo em instantes ou fale com a gente pelo WhatsApp.';

/** Ordem em que os erros são procurados para levar o foco ao primeiro. */
const ORDEM_CAMPOS = [
  'serviceId',
  'professional',
  'date',
  'period',
  'customerName',
  'customerPhone',
  'customerEmail',
  'notes',
];

function agrupar(services) {
  const grupos = new Map();
  for (const item of services) {
    const chave = item.category ?? '';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(item);
  }
  return [...grupos];
}

/**
 * Pedido de agendamento, pensado para o polegar.
 *
 * Toda escolha é um rádio nativo com cara de botão grande: o toque acerta,
 * teclado e leitor de tela funcionam sem nada extra, e o formulário continua
 * sendo um formulário. Os dias rolam na horizontal — um calendário mensal num
 * celular vira alvo de 30px para quem só tem 21 dias possíveis.
 */
export default function BookingForm({
  services,
  dates,
  periods,
  professionals,
  initialServiceId,
  successText,
  whatsappNumber,
}) {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const formRef = useRef(null);

  const [form, setForm] = useState({
    serviceId: services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : services.length === 1
        ? services[0].id
        : '',
    professional: '',
    date: '',
    period: periods.length === 1 ? periods[0] : '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // O erro de um campo some assim que a pessoa mexe nele: manter o vermelho
    // depois da correção faz parecer que a correção não valeu.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const servico = services.find((s) => s.id === form.serviceId);

  /** Leva o foco ao primeiro campo com erro, para quem usa teclado ou leitor. */
  function focarPrimeiroErro(errs) {
    const campo = ORDEM_CAMPOS.find((nome) => errs[nome]);
    if (!campo) return;
    const alvo = formRef.current?.querySelector(
      `[name="${campo}"]:checked, [name="${campo}"]`,
    );
    alvo?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError('');

    const { validateAppointmentRequest } = await carregarValidacao();

    const result = validateAppointmentRequest(form);
    if (!result.success) {
      setErrors(result.errors);
      focarPrimeiroErro(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => null);

      if (response.status === 201 && body?.appointment) {
        setDone(body.appointment);
        window.scrollTo({ top: 0 });
        return;
      }

      if (response.status === 400 && body?.error?.details) {
        setErrors(body.error.details);
        focarPrimeiroErro(body.error.details);
      }
      setFormError(body?.error?.message ?? GENERIC_ERROR);
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <BookingSuccess
        appointment={done}
        successText={successText}
        whatsappNumber={whatsappNumber}
        onAgain={() => {
          setDone(null);
          setForm((prev) => ({ ...prev, date: '', notes: '' }));
        }}
      />
    );
  }

  const erroDe = (nome) =>
    errors[nome] ? (
      <p id={id(`${nome}-erro`)} className={styles.groupError}>
        {errors[nome]}
      </p>
    ) : null;

  const descrito = (nome) => (errors[nome] ? id(`${nome}-erro`) : undefined);

  const resumoPronto = servico && form.date && form.period;

  return (
    <form
      onFocusCapture={carregarValidacao}
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      {formError && <Aviso>{formError}</Aviso>}

      <fieldset
        className={styles.group}
        aria-describedby={descrito('serviceId')}
      >
        <legend className={styles.legend}>Qual serviço?</legend>
        {erroDe('serviceId')}
        {agrupar(services).map(([categoria, itens]) => (
          <div key={categoria || 'geral'} className={styles.serviceGroup}>
            {categoria && <p className={styles.category}>{categoria}</p>}
            <div className={styles.services}>
              {itens.map((item) => (
                <label key={item.id} className={styles.service}>
                  <input
                    type="radio"
                    name="serviceId"
                    value={item.id}
                    checked={form.serviceId === item.id}
                    onChange={() => update('serviceId', item.id)}
                    className={styles.radio}
                  />
                  <span className={styles.serviceName}>{item.name}</span>
                  <span className={styles.serviceMeta}>
                    {formatPrice(item.priceCents, item.priceFrom)}
                    {formatDuration(item.durationMinutes) &&
                      ` · ${formatDuration(item.durationMinutes)}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      {professionals.length > 0 && (
        <fieldset
          className={styles.group}
          aria-describedby={descrito('professional')}
        >
          <legend className={styles.legend}>Com quem? (opcional)</legend>
          {erroDe('professional')}
          <div className={styles.chips}>
            {['', ...professionals].map((nome) => (
              <label key={nome || 'qualquer'} className={styles.chip}>
                <input
                  type="radio"
                  name="professional"
                  value={nome}
                  checked={form.professional === nome}
                  onChange={() => update('professional', nome)}
                  className={styles.radio}
                />
                <span>{nome || 'Sem preferência'}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className={styles.group} aria-describedby={descrito('date')}>
        <legend className={styles.legend}>Qual dia?</legend>
        {erroDe('date')}
        <div className={styles.daysWrap}>
          {/* Rolagem horizontal com trava: um dia por "encaixe", e a borda
              esmaecida à direita avisa que há mais dias. */}
          <div className={styles.days}>
            {dates.map((dia) => {
              const partes = dateParts(dia);
              return (
                <label key={dia} className={styles.day}>
                  <input
                    type="radio"
                    name="date"
                    value={dia}
                    checked={form.date === dia}
                    onChange={() => update('date', dia)}
                    className={styles.radio}
                    aria-label={formatDateLong(dia)}
                  />
                  <span className={styles.dayWeek} aria-hidden="true">
                    {partes.semana}
                  </span>
                  <span className={styles.dayNumber} aria-hidden="true">
                    {partes.dia}
                  </span>
                  <span className={styles.dayMonth} aria-hidden="true">
                    {partes.mes}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.group} aria-describedby={descrito('period')}>
        <legend className={styles.legend}>Qual período?</legend>
        {erroDe('period')}
        <div className={styles.chips}>
          {periods.map((valor) => (
            <label key={valor} className={`${styles.chip} ${styles.chipWide}`}>
              <input
                type="radio"
                name="period"
                value={valor}
                checked={form.period === valor}
                onChange={() => update('period', valor)}
                className={styles.radio}
              />
              <span>{labelOf(BOOKING_PERIODS, valor)}</span>
            </label>
          ))}
        </div>
        <p className={styles.hint}>
          A gente confirma o horário exato com você.
        </p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Seus dados</legend>
        <div className={styles.fields}>
          <Campo
            id={id('nome')}
            name="customerName"
            label="Nome"
            autoComplete="name"
            value={form.customerName}
            error={errors.customerName}
            errorId={id('customerName-erro')}
            onChange={(e) => update('customerName', e.target.value)}
          />
          <Campo
            id={id('telefone')}
            name="customerPhone"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={form.customerPhone}
            error={errors.customerPhone}
            errorId={id('customerPhone-erro')}
            dica="É por ele que a gente confirma o horário."
            dicaId={id('telefone-dica')}
            onChange={(e) => update('customerPhone', e.target.value)}
          />
          <Campo
            id={id('email')}
            name="customerEmail"
            label="E-mail (opcional)"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.customerEmail}
            error={errors.customerEmail}
            errorId={id('customerEmail-erro')}
            onChange={(e) => update('customerEmail', e.target.value)}
          />
          <div className={authStyles.field}>
            <label htmlFor={id('obs')} className={authStyles.label}>
              Observação (opcional)
            </label>
            <textarea
              id={id('obs')}
              name="notes"
              className={`${authStyles.input} ${styles.textarea} ${errors.notes ? authStyles.inputError : ''}`}
              rows={3}
              maxLength={500}
              placeholder="Ex.: cabelo abaixo do ombro, prefiro depois das 15h"
              value={form.notes}
              aria-invalid={errors.notes ? 'true' : undefined}
              aria-describedby={errors.notes ? id('notes-erro') : undefined}
              onChange={(e) => update('notes', e.target.value)}
            />
            {errors.notes && (
              <p id={id('notes-erro')} className={authStyles.fieldError}>
                {errors.notes}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {resumoPronto && (
        // O resumo repete a escolha antes do envio: no celular, o serviço
        // escolhido lá em cima já saiu da tela quando se chega aqui.
        <p className={styles.summary} aria-live="polite">
          <strong>{servico.name}</strong>
          <span>
            {formatDateLong(form.date)} ({formatDateShort(form.date)}) ·{' '}
            {labelOf(BOOKING_PERIODS, form.period).toLowerCase()}
          </span>
        </p>
      )}

      <Botao carregando={submitting}>Pedir horário</Botao>

      <p className={styles.privacy}>
        Usamos seus dados só para combinar este atendimento.{' '}
        <Link href="/privacidade">Política de privacidade</Link>
      </p>
    </form>
  );
}

function BookingSuccess({ appointment, successText, whatsappNumber, onAgain }) {
  const trackingPath = `/agendar/pedido/${appointment.code}`;
  const whatsapp = whatsappLink(
    whatsappNumber,
    `Olá! Fiz o pedido ${appointment.code} pelo site: ${appointment.serviceName}, ${formatDateShort(appointment.requestedDate)}, ${labelOf(BOOKING_PERIODS, appointment.requestedPeriod).toLowerCase()}.`,
  );

  return (
    <div className={styles.success} role="status">
      <svg
        className={styles.successIcon}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm5.3 8.1-6.2 6.3a1 1 0 0 1-1.4 0L6.7 12.4 8.1 11l2.3 2.3 5.5-5.6 1.4 1.4Z"
        />
      </svg>
      <h2 className={styles.successTitle}>Pedido enviado!</h2>
      <p className={styles.successText}>{successText}</p>

      <dl className={styles.successList}>
        <div>
          <dt>Serviço</dt>
          <dd>{appointment.serviceName}</dd>
        </div>
        <div>
          <dt>Pedido para</dt>
          <dd>
            {formatDateLong(appointment.requestedDate)},{' '}
            {labelOf(
              BOOKING_PERIODS,
              appointment.requestedPeriod,
            ).toLowerCase()}
          </dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd className={styles.code}>{appointment.code}</dd>
        </div>
      </dl>

      <div className={styles.successActions}>
        <Link href={trackingPath} className={styles.primaryLink}>
          Acompanhar pedido
        </Link>
        {whatsapp && (
          <a href={whatsapp} className={styles.secondaryLink}>
            Falar no WhatsApp
          </a>
        )}
        <button type="button" className={styles.textButton} onClick={onAgain}>
          Fazer outro pedido
        </button>
      </div>
    </div>
  );
}
