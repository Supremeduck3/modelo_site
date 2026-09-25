import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppointmentActions from '@/components/painel/AppointmentActions';
import { features, siteConfig } from '@/config/site';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import {
  APPOINTMENT_STATUSES,
  actionsFor,
  BOOKING_PERIODS,
  labelOf,
} from '@/lib/booking/constants';
import { formatDateLong, formatDateShort } from '@/lib/booking/dates';
import { formatPhone, telLink, whatsappLink } from '@/lib/whatsapp';
import { requireSessionUser } from '@/server/modules/auth/session';
import { getAppointmentDetail } from '@/server/modules/booking/service';
import { appointmentTrackingUrl } from '@/server/modules/mail/notifications';
import styles from './pedido.module.css';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  // Fuso da empresa, o mesmo que decide o "hoje" da agenda.
  timeZone: siteConfig.booking.timezone,
});

function descreverEvento(evento) {
  if (evento.eventType === 'requested') return 'Pedido feito pelo site';
  const para = labelOf(APPOINTMENT_STATUSES, evento.toValue);
  return `${para}${evento.actor?.name ? ` — ${evento.actor.name}` : ''}`;
}

export default async function PedidoPainelPage({ params }) {
  if (!features.booking) notFound();

  const user = await requireSessionUser('/painel/agenda');
  if (!can(user, PERMISSIONS.APPOINTMENTS_VIEW)) notFound();

  const { id } = await params;
  const pedido = await getAppointmentDetail(user.companyId, id);
  if (!pedido) notFound();

  const agendado =
    pedido.scheduledDate && pedido.scheduledTime
      ? `${formatDateLong(pedido.scheduledDate)} (${formatDateShort(pedido.scheduledDate)}), às ${pedido.scheduledTime}`
      : null;

  const telefone = formatPhone(pedido.customerPhone);
  const conversa = whatsappLink(
    pedido.customerPhone,
    `Olá, ${pedido.customerName.split(' ')[0]}! Aqui é da ${siteConfig.identity.name}, sobre o seu pedido de ${pedido.serviceName}.`,
  );

  return (
    <div className={styles.root}>
      <Link href="/painel/agenda" className={styles.back}>
        ← Agenda
      </Link>

      <header className={styles.header}>
        <p className={styles.code}>{pedido.code}</p>
        <h2 className={styles.title}>{pedido.customerName}</h2>
        <p className={`${styles.status} ${styles[pedido.status] ?? ''}`}>
          {labelOf(APPOINTMENT_STATUSES, pedido.status)}
        </p>
      </header>

      {/* Contato primeiro: quase toda confirmação acontece por aqui. */}
      <div className={styles.contact}>
        {conversa && (
          <a
            href={conversa}
            className={styles.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {telefone}
          </a>
        )}
        {telLink(pedido.customerPhone) && (
          <a href={telLink(pedido.customerPhone)} className={styles.call}>
            Ligar
          </a>
        )}
        {pedido.customerEmail && (
          <a href={`mailto:${pedido.customerEmail}`} className={styles.call}>
            E-mail
          </a>
        )}
      </div>

      <dl className={styles.details}>
        <div>
          <dt>Serviço</dt>
          <dd>{pedido.serviceName}</dd>
        </div>
        {pedido.professional && (
          <div>
            <dt>Profissional de preferência</dt>
            <dd>{pedido.professional}</dd>
          </div>
        )}
        <div>
          <dt>Pediu para</dt>
          <dd>
            {formatDateLong(pedido.requestedDate)},{' '}
            {labelOf(BOOKING_PERIODS, pedido.requestedPeriod).toLowerCase()}
          </dd>
        </div>
        {agendado && (
          <div className={styles.highlight}>
            <dt>
              {pedido.status === 'proposed' ? 'Horário proposto' : 'Horário'}
            </dt>
            <dd>{agendado}</dd>
          </div>
        )}
        {pedido.notes && (
          <div>
            <dt>Observação do cliente</dt>
            <dd className={styles.notes}>{pedido.notes}</dd>
          </div>
        )}
        {pedido.responseMessage && (
          <div>
            <dt>Última mensagem ao cliente</dt>
            <dd className={styles.notes}>{pedido.responseMessage}</dd>
          </div>
        )}
      </dl>

      {can(user, PERMISSIONS.APPOINTMENTS_MANAGE) && (
        <AppointmentActions
          appointment={{
            id: pedido.id,
            code: pedido.code,
            status: pedido.status,
            customerName: pedido.customerName,
            customerPhone: pedido.customerPhone,
            customerEmail: pedido.customerEmail,
            serviceName: pedido.serviceName,
            requestedDate: pedido.requestedDate,
            requestedPeriod: pedido.requestedPeriod,
            scheduledDate: pedido.scheduledDate,
            scheduledTime: pedido.scheduledTime,
            responseMessage: pedido.responseMessage,
          }}
          actions={actionsFor(pedido.status)}
          companyName={siteConfig.identity.name}
          trackingUrl={appointmentTrackingUrl(pedido.code)}
        />
      )}

      <section className={styles.history}>
        <h3 className={styles.historyTitle}>Histórico</h3>
        <ol className={styles.timeline}>
          {pedido.events.map((evento) => (
            <li key={evento.id}>
              <span className={styles.eventWhen}>
                {dataHora.format(evento.createdAt)}
              </span>
              <span>{descreverEvento(evento)}</span>
              {evento.note && (
                <span className={styles.eventNote}>{evento.note}</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
