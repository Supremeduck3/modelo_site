import Section from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import ContactInfo from './ContactInfo';
import styles from './contact.module.css';

/** Contatos ao lado de um mapa incorporado (quando configurado). */
export default function ContactMap({ id, content }) {
  const { mapEmbedUrl } = siteConfig.contact;

  return (
    <Section id={id} title={content.title} subtitle={content.subtitle}>
      <div className={styles.split}>
        <ContactInfo compact />
        {mapEmbedUrl ? (
          <iframe
            className={styles.map}
            src={mapEmbedUrl}
            title={`Mapa — ${siteConfig.identity.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className={styles.mapPlaceholder} aria-hidden="true" />
        )}
      </div>
    </Section>
  );
}
