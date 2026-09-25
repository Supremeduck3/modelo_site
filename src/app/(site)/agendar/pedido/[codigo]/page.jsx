import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import { features, siteConfig } from '@/config/site';
import {
  APPOINTMENT_STATUSES,
  BOOKING_PERIODS,
  labelOf,
} from '@/lib/booking/constants';
import { formatDateLong, formatDateShort } from '@/lib/booking/dates';
import { whatsappLink } from '@/lib/whatsapp';
import { getAppointmentByCode } from '@/server/modules/booking/service';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

/*
 * Página de um pedido só, acessada pelo link com o código: não entra em
 * buscador nem em cache de buscador.
 */
export const metadata = {
  title: `Seu pedido de horário — ${siteConfig.identity.name}`,
  robots: { index: false, follow: false, nocache: true },
};

/** O que o cliente precisa saber (e fazer) em cada situação. */
const PROXIMO_PASSO = {
  pending:
    'Recebemos seu pedido. Vamos conferir a agenda e confirmar o horário com você pelo WhatsApp.',
  proposed:
    'Não conseguimos o horário que você pediu e propusemos outro. Responda pelo WhatsApp se ele funciona para você.',
  confirmed: 'Seu horário está confirmado. Até lá!',
  declined:
    'Não conseguimos atender este pedido. Se quiser, faça um novo pedido em outro dia.',
  cancelled: 'Este horário foi cancelado.',
  completed: 'Atendimento realizado. Obrigado pela visita!',
  no_show: 'Este horário não foi utilizado.',
};

const TOM = {
  pending: styles.toneWait,
  proposed: styles.toneAttention,
  confirmed: styles.toneOk,
  completed: styles.toneOk,
};

export default async function PedidoPage({ params }) {
  if (!features.booking) notFound();

  const { codigo } = await params;
  const pedido = await getAppointmentByCode(codigo);
  if (!pedido) notFound();

  const agendado =
    pedido.scheduledDate && pedido.scheduledTime
      ? `${formatDateLong(pedido.scheduledDate)} (${formatDateShort(pedido.scheduledDate)}), às ${pedido.scheduledTime}`
      : null;

  const mensagem =
    pedido.status === 'proposed'
      ? `Olá! Sobre o pedido ${pedido.code}: o horário proposto (${agendado}) funciona para mim.`
      : `Olá! Tenho uma dúvida sobre o pedido ${pedido.code}.`;
  const whatsapp = whatsappLink(siteConfig.contact.whatsapp, mensagem);

  return (
    <Container>
      <div className={styles.wrapper}>
        <p className={styles.eyebrow}>Pedido {pedido.code}</p>
        <h1 className={styles.title}>{pedido.serviceName}</h1>

        <p className={`${styles.status} ${TOM[pedido.status] ?? ''}`}>
          {labelOf(APPOINTMENT_STATUSES, pedido.status)}
        </p>
        <p className={styles.next}>{PROXIMO_PASSO[pedido.status]}</p>

        <dl className={styles.list}>
          {agendado && (
            <div className={styles.highlight}>
              <dt>
                {pedido.status === 'proposed' ? 'Horário proposto' : 'Horário'}
              </dt>
              <dd>{agendado}</dd>
            </div>
          )}
          <div>
            <dt>Você pediu</dt>
            <dd>
              {formatDateLong(pedido.requestedDate)},{' '}
              {labelOf(BOOKING_PERIODS, pedido.requestedPeriod).toLowerCase()}
            </dd>
          </div>
          {pedido.professional && (
            <div>
              <dt>Profissional</dt>
              <dd>{pedido.professional}</dd>
            </div>
          )}
          {siteConfig.contact.address && (
            <div>
              <dt>Endereço</dt>
              <dd>
                {siteConfig.contact.address}
                {siteConfig.contact.city ? ` — ${siteConfig.contact.city}` : ''}
              </dd>
            </div>
          )}
        </dl>

        {pedido.responseMessage && (
          <blockquote className={styles.message}>
            <p>{pedido.responseMessage}</p>
            <footer>— {siteConfig.identity.name}</footer>
          </blockquote>
        )}

        <div className={styles.actions}>
          {whatsapp && (
            <a href={whatsapp} className={styles.primary}>
              {pedido.status === 'proposed'
                ? 'Aceitar pelo WhatsApp'
                : 'Falar no WhatsApp'}
            </a>
          )}
          <Link href="/agendar" className={styles.secondary}>
            Fazer outro pedido
          </Link>
        </div>
      </div>
    </Container>
  );
}
