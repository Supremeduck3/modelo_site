import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import styles from './submission.module.css';

/** Faixa de chamada para o canal de manifestações. */
export default function SubmissionCta({ id, content = {} }) {
  const { navigation } = siteConfig;

  return (
    <Section id={id} tone="accent" fullWidth={false}>
      <div className={styles.banner}>
        <div>
          <h2 className={styles.title}>{content.title}</h2>
          {content.text && <p className={styles.text}>{content.text}</p>}
        </div>
        <Button
          href={content.ctaHref ?? navigation.ctaHref}
          variant="secondary"
          size="lg"
        >
          {content.ctaLabel ?? navigation.ctaLabel}
        </Button>
      </div>
    </Section>
  );
}
