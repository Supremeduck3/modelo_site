import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Reveal from '@/components/ui/Reveal';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/**
 * Bloco sólido focado na conversão.
 *
 * As ações saem do fluxo do texto e vão para a coluna da direita, alinhadas à
 * base do título: o olho lê a promessa e cai direto no botão.
 */
export default function HeroCtaFocus({ id, content = {} }) {
  const { primaryCta, secondaryCta, ...text } = content;

  return (
    <section id={id} className={styles.ctaFocus}>
      <Container className={styles.ctaFocusInner}>
        <HeroContent content={text} inverted />
        {(primaryCta || secondaryCta) && (
          <Reveal className={styles.ctaFocusAside} delay={160}>
            <div className={styles.actions}>
              {primaryCta && (
                <Button href={primaryCta.href} size="lg" variant="secondary">
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button href={secondaryCta.href} size="lg" variant="ghost">
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
