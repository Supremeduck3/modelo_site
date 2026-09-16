import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import ContactInfo from './ContactInfo';
import styles from './contact.module.css';

/**
 * Contatos + chamada para o canal de manifestações.
 * O formulário real vive no canal (bloco 2) — aqui não duplicamos a regra.
 */
export default function ContactFormSplit({ id, content = {} }) {
  const { navigation } = siteConfig;

  return (
    <Section
      id={id}
      title={content.title}
      subtitle={content.subtitle}
      tone="surface"
    >
      <div className={styles.split}>
        <ContactInfo compact />
        <div className={styles.callout}>
          <h3>{content.calloutTitle}</h3>
          <p>{content.calloutText}</p>
          <Button href={navigation.ctaHref} size="lg">
            {content.calloutCta ?? navigation.ctaLabel}
          </Button>
        </div>
      </div>
    </Section>
  );
}
