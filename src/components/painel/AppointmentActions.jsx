'use client';

import { Alert, App, Button, Popconfirm } from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { APPOINTMENT_ACTIONS } from '@/lib/booking/constants';
import { validateAppointmentAction } from '@/lib/booking/management-schema';
import { customerMessage } from '@/lib/booking/messages';
import { whatsappLink } from '@/lib/whatsapp';
import styles from './appointment-actions.module.css';

const GENERIC_ERROR = 'Não foi possível salvar agora. Tente novamente.';

/** Hora sugerida ao abrir o formulário, pelo período que o cliente pediu. */
const HORA_DO_PERIODO = { manha: '09:00', tarde: '14:00', noite: '19:00' };

/** Ações que abrem formulário; as outras são confirmação de um toque. */
const COM_FORMULARIO = ['confirm', 'propose', 'decline', 'cancel'];

const TEXTO_BOTAO = {
  confirm: 'Confirmar horário',
  propose: 'Propor outro horário',
  decline: 'Recusar',
  cancel: 'Cancelar horário',
  complete: 'Atendido',
  no_show: 'Não compareceu',
};

const PLACEHOLDER = {
  confirm: 'Opcional. Ex.: chegue 10 minutos antes.',
  propose: 'Opcional. Ex.: à tarde só temos esse horário.',
  decline: 'Opcional. Ex.: estamos com a agenda cheia nesse dia.',
  cancel: 'Opcional. Ex.: a profissional ficou doente.',
};

/**
 * Ações da equipe sobre um pedido de agendamento.
 *
 * Depois de cada decisão, o botão principal passa a ser "Avisar no WhatsApp",
 * com a mensagem já escrita — é assim que o salão fala com o cliente, e o
 * sistema não finge que mandou algo que não mandou. Se o cliente deixou
 * e-mail, o aviso por e-mail sai sozinho.
 */
export default function AppointmentActions({
  appointment,
  actions,
  companyName,
  trackingUrl,
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const id = (nome) => `${uid}-${nome}`;

  const [aberta, setAberta] = useState(null);
  const [form, setForm] = useState({ date: '', time: '', message: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [aviso, setAviso] = useState(null);

  function abrir(acao) {
    setAberta(acao);
    setErrors({});
    setFormError('');
    setAviso(null);
    setForm({
      date: appointment.scheduledDate ?? appointment.requestedDate,
      time:
        appointment.scheduledTime ??
        HORA_DO_PERIODO[appointment.requestedPeriod] ??
        '',
      message: '',
    });
  }

  async function enviar(acao, dados) {
    if (saving) return;
    setFormError('');

    // `from`: o status desta tela. Se outra pessoa mudou o pedido nesse meio
    // tempo, o servidor recusa em vez de sobrescrever.
    const corpo = { action: acao, from: appointment.status, ...dados };
    const result = validateAppointmentAction(corpo);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const response = await fetch(`/api/painel/agenda/${appointment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details);
        setFormError(body?.error?.message ?? GENERIC_ERROR);
        return;
      }

      const status = body.appointment.status;
      const texto = customerMessage({
        appointment: {
          ...appointment,
          status,
          scheduledDate: body.appointment.scheduledDate,
          scheduledTime: body.appointment.scheduledTime,
          responseMessage: result.data.message ?? null,
        },
        status,
        companyName,
        trackingUrl,
      });

      setAberta(null);
      setAviso(
        texto
          ? {
              link: whatsappLink(appointment.customerPhone, texto),
              texto,
              status,
            }
          : null,
      );
      message.success('Pedido atualizado.');
      router.refresh();
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  }

  const precisaHorario = aberta && APPOINTMENT_ACTIONS[aberta]?.needsSchedule;

  return (
    <section className={styles.root} aria-labelledby={id('titulo')}>
      <h3 id={id('titulo')} className={styles.title}>
        {aviso ? 'Avise o cliente' : 'O que fazer com este pedido'}
      </h3>

      {aviso && (
        <div className={styles.notice}>
          <p className={styles.noticeText}>
            {appointment.customerEmail
              ? 'O cliente também recebe esta mensagem por e-mail.'
              : 'O cliente não deixou e-mail: mande a mensagem pelo WhatsApp.'}
          </p>
          <pre className={styles.preview}>{aviso.texto}</pre>
          {aviso.link && (
            <a
              href={aviso.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsapp}
            >
              Avisar no WhatsApp
            </a>
          )}
        </div>
      )}

      {formError && <Alert type="error" message={formError} showIcon />}

      {aberta ? (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            enviar(aberta, precisaHorario ? form : { message: form.message });
          }}
          noValidate
        >
          <p className={styles.formTitle}>{TEXTO_BOTAO[aberta]}</p>

          {precisaHorario && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor={id('dia')}>Dia</label>
                <input
                  id={id('dia')}
                  type="date"
                  className={styles.input}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  aria-invalid={errors.date ? 'true' : undefined}
                  aria-describedby={errors.date ? id('dia-e') : undefined}
                />
                {errors.date && (
                  <p id={id('dia-e')} className={styles.error}>
                    {errors.date}
                  </p>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor={id('hora')}>Hora</label>
                <input
                  id={id('hora')}
                  type="time"
                  step={300}
                  className={styles.input}
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  aria-invalid={errors.time ? 'true' : undefined}
                  aria-describedby={errors.time ? id('hora-e') : undefined}
                />
                {errors.time && (
                  <p id={id('hora-e')} className={styles.error}>
                    {errors.time}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor={id('msg')}>Mensagem ao cliente</label>
            <textarea
              id={id('msg')}
              className={`${styles.input} ${styles.textarea}`}
              rows={3}
              maxLength={500}
              placeholder={PLACEHOLDER[aberta]}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <p className={styles.hint}>
              Aparece para o cliente na página do pedido e na mensagem.
            </p>
          </div>

          <div className={styles.formActions}>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              danger={aberta === 'decline' || aberta === 'cancel'}
              size="large"
            >
              {TEXTO_BOTAO[aberta]}
            </Button>
            <Button
              size="large"
              onClick={() => setAberta(null)}
              disabled={saving}
            >
              Voltar
            </Button>
          </div>
        </form>
      ) : (
        actions.length > 0 && (
          <div className={styles.buttons}>
            {actions.map((acao) =>
              COM_FORMULARIO.includes(acao) ? (
                <Button
                  key={acao}
                  size="large"
                  type={acao === 'confirm' ? 'primary' : 'default'}
                  danger={acao === 'decline' || acao === 'cancel'}
                  onClick={() => abrir(acao)}
                >
                  {TEXTO_BOTAO[acao]}
                </Button>
              ) : (
                <Popconfirm
                  key={acao}
                  title={
                    acao === 'complete'
                      ? 'Marcar como atendido?'
                      : 'Marcar que o cliente não compareceu?'
                  }
                  okText="Sim"
                  cancelText="Não"
                  onConfirm={() => enviar(acao, {})}
                >
                  <Button size="large" loading={saving}>
                    {TEXTO_BOTAO[acao]}
                  </Button>
                </Popconfirm>
              ),
            )}
          </div>
        )
      )}

      {!aberta && actions.length === 0 && !aviso && (
        <p className={styles.hint}>
          Este pedido está encerrado. O histórico abaixo mostra o que aconteceu.
        </p>
      )}
    </section>
  );
}
