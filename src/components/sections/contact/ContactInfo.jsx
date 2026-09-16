import { siteConfig } from '@/config/site';
import styles from './contact.module.css';

/**
 * Dados de contato da implantação em formato de lista.
 * Todas as variantes consomem daqui — nenhuma repete o acesso à config.
 */
export default function ContactInfo({ compact = false }) {
  const { contact } = siteConfig;
  const entries = [
    contact.phone && {
      label: 'Telefone',
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\D/g, '')}`,
    },
    contact.whatsapp && {
      label: 'WhatsApp',
      value: contact.whatsapp,
      href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`,
    },
    contact.email && {
      label: 'E-mail',
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    contact.address && {
      label: 'Endereço',
      value: [contact.address, contact.city, contact.state]
        .filter(Boolean)
        .join(' — '),
    },
  ].filter(Boolean);

  return (
    <div
      className={`${styles.info} ${compact ? styles.infoCompact : ''}`.trim()}
    >
      {entries.map((entry) => (
        <div key={entry.label} className={styles.card}>
          <p className={styles.cardLabel}>{entry.label}</p>
          {entry.href ? (
            <a className={styles.cardValue} href={entry.href}>
              {entry.value}
            </a>
          ) : (
            <p className={styles.cardValue}>{entry.value}</p>
          )}
        </div>
      ))}

      {contact.businessHours?.length > 0 && (
        <div className={styles.card}>
          <p className={styles.cardLabel}>Horário de atendimento</p>
          {contact.businessHours.map((slot) => (
            <p key={slot.days} className={styles.hours}>
              {slot.days}: {slot.hours}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
