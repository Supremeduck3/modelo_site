import Container from '@/components/ui/Container';
import Media from '@/components/ui/Media';
import Reveal from '@/components/ui/Reveal';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/**
 * Texto e mídia em colunas desiguais. A mídia entra depois do texto: a leitura
 * começa pela promessa, não pela foto.
 */
export default function HeroSplit({ id, content = {} }) {
  return (
    <section id={id} className={styles.split}>
      <Container className={styles.splitInner}>
        <HeroContent content={content} />
        <Reveal imediato>
          <Media
            priority
            src={content.image}
            alt={content.imageAlt ?? ''}
            className={styles.splitMedia}
          />
        </Reveal>
      </Container>
    </section>
  );
}
