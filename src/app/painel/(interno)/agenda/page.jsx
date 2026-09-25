import Link from 'next/link';
import { notFound } from 'next/navigation';
import { features, siteConfig } from '@/config/site';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import {
  APPOINTMENT_STATUSES,
  BOOKING_PERIODS,
  labelOf,
} from '@/lib/booking/constants';
import {
  addDays,
  formatDateLong,
  formatDateShort,
  todayIn,
} from '@/lib/booking/dates';
import { formatPhone } from '@/lib/whatsapp';
import { requireSessionUser } from '@/server/modules/auth/session';
import { listAppointments } from '@/server/modules/booking/service';
import styles from './agenda.module.css';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

const ABAS = [
  { key: 'pendentes', label: 'A responder' },
  { key: 'proximos', label: 'Próximos' },
  { key: 'historico', label: 'Todos' },
];

const VAZIO = {
  pendentes: 'Nenhum pedido esperando resposta.',
  proximos: 'Nenhum horário confirmado daqui para frente.',
  historico: 'Nenhum pedido recebido ainda.',
};

/** "Hoje", "Amanhã" ou a data por extenso: é como a agenda do salão fala. */
function rotuloDoDia(dia, hoje) {
  if (dia === hoje) return 'Hoje';
  if (dia === addDays(hoje, 1)) return 'Amanhã';
  return `${formatDateLong(dia)}`;
}

function quando(item) {
  if (item.scheduledDate && item.scheduledTime) {
    return `${formatDateShort(item.scheduledDate)} às ${item.scheduledTime}`;
  }
  return `Pediu ${formatDateShort(item.requestedDate)}, ${labelOf(BOOKING_PERIODS, item.requestedPeriod).toLowerCase()}`;
}

function Item({ item, mostrarHora }) {
  return (
    <li>
      <Link href={`/painel/agenda/${item.id}`} className={styles.item}>
        {mostrarHora && (
          <span className={styles.time}>{item.scheduledTime}</span>
        )}
        <span className={styles.main}>
          <span className={styles.name}>{item.customerName}</span>
          <span className={styles.service}>
            {item.serviceName}
            {item.professional ? ` · ${item.professional}` : ''}
          </span>
          {!mostrarHora && <span className={styles.when}>{quando(item)}</span>}
        </span>
        <span className={styles.side}>
          <span className={`${styles.status} ${styles[item.status] ?? ''}`}>
            {labelOf(APPOINTMENT_STATUSES, item.status)}
          </span>
          <span className={styles.phone}>
            {formatPhone(item.customerPhone)}
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * Agenda: pedidos a responder, próximos horários e histórico.
 *
 * Lista de toque, não tabela: a agenda do salão é consultada no celular, no
 * balcão, entre um cliente e outro.
 */
export default async function AgendaPage({ searchParams }) {
  if (!features.booking) notFound();

  const user = await requireSessionUser('/painel/agenda');
  if (!can(user, PERMISSIONS.APPOINTMENTS_VIEW)) notFound();

  const params = await searchParams;
  const aba = ABAS.some((a) => a.key === params?.ver)
    ? params.ver
    : 'pendentes';
  const itens = await listAppointments(user.companyId, aba);

  const hoje = todayIn(siteConfig.booking.timezone);

  // Próximos: agrupados por dia, na ordem da agenda.
  const porDia = new Map();
  if (aba === 'proximos') {
    for (const item of itens) {
      if (!porDia.has(item.scheduledDate)) porDia.set(item.scheduledDate, []);
      porDia.get(item.scheduledDate).push(item);
    }
  }

  return (
    <div className={styles.root}>
      <nav className={styles.tabs} aria-label="Visões da agenda">
        {ABAS.map((a) => (
          <Link
            key={a.key}
            href={`/painel/agenda?ver=${a.key}`}
            className={`${styles.tab} ${a.key === aba ? styles.tabActive : ''}`}
            aria-current={a.key === aba ? 'page' : undefined}
          >
            {a.label}
          </Link>
        ))}
      </nav>

      {itens.length === 0 ? (
        <p className={styles.empty}>{VAZIO[aba]}</p>
      ) : aba === 'proximos' ? (
        [...porDia].map(([dia, lista]) => (
          <section key={dia} className={styles.day}>
            <h2 className={styles.dayTitle}>
              {rotuloDoDia(dia, hoje)}
              <span className={styles.dayCount}>
                {lista.length} {lista.length === 1 ? 'horário' : 'horários'}
              </span>
            </h2>
            <ul className={styles.list}>
              {lista.map((item) => (
                <Item key={item.id} item={item} mostrarHora />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <ul className={styles.list}>
          {itens.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
