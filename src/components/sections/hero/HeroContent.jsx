import Button from '@/components/ui/Button';
import styles from './hero.module.css';

/**
 * Miolo textual do hero, compartilhado por todas as variantes.
 * Variante visual não duplica conteúdo nem regra — só muda o arranjo.
 */
export default function HeroContent({
  content = {},
  align = 'left',
  inverted,
}) {
  const { eyebrow, title, subtitle, primaryCta, secondaryCta } = content;

  return (
    <div
      className={`${styles.content} ${styles[align] ?? ''} ${inverted ? styles.inverted : ''}`.trim()}
    >
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {title && <h1 className={styles.title}>{title}</h1>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {(primaryCta || secondaryCta) && (
        <div className={styles.actions}>
          {primaryCta && (
            <Button href={primaryCta.href} size="lg">
              {primaryCta.label}
            </Button>
          )}
          {secondaryCta && (
            <Button
              href={secondaryCta.href}
              size="lg"
              variant={inverted ? 'secondary' : 'outline'}
            >
              {secondaryCta.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
