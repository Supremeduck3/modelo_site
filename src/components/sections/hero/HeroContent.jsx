import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import styles from './hero.module.css';

/**
 * Miolo textual do hero, compartilhado por todas as variantes.
 * Variante visual não duplica conteúdo nem regra — só muda o arranjo.
 *
 * A entrada em cena fica aqui, com um único observer por hero: o escalonamento
 * entre eyebrow, título, apoio e ações é resolvido no CSS.
 *
 * O hero entra como `imediato`: ele já está na dobra, e esperar hidratação para
 * aparecer atrasava o maior elemento da página. Ver `Reveal`.
 */
export default function HeroContent({
  content = {},
  align = 'left',
  inverted,
}) {
  const { eyebrow, title, subtitle, primaryCta, secondaryCta } = content;

  return (
    <Reveal
      imediato
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
            // Em fundo tratado, o segundo caminho vira link sublinhado: dois
            // botões sólidos disputariam a atenção do CTA principal.
            <Button
              href={secondaryCta.href}
              size="lg"
              variant={inverted ? 'ghost' : 'outline'}
            >
              {secondaryCta.label}
            </Button>
          )}
        </div>
      )}
    </Reveal>
  );
}
