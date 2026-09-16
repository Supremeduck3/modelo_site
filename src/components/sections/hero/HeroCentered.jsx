import Container from '@/components/ui/Container';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/** Texto centralizado, sem mídia — bom para negócios com pouca fotografia. */
export default function HeroCentered({ id, content = {} }) {
  return (
    <section id={id} className={styles.centeredSection}>
      <Container>
        <HeroContent content={content} align="center" />
      </Container>
    </section>
  );
}
