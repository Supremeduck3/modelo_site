import Container from '@/components/ui/Container';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/** Bloco compacto com cor sólida, focado na conversão. */
export default function HeroCtaFocus({ id, content = {} }) {
  return (
    <section id={id} className={styles.ctaFocus}>
      <Container>
        <HeroContent content={content} align="center" inverted />
      </Container>
    </section>
  );
}
