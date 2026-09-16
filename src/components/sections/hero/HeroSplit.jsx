import Container from '@/components/ui/Container';
import Media from '@/components/ui/Media';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/** Texto à esquerda, mídia à direita. */
export default function HeroSplit({ id, content }) {
  return (
    <section id={id} className={styles.split}>
      <Container className={styles.splitInner}>
        <HeroContent content={content} />
        <Media
          src={content.image}
          alt={content.imageAlt ?? ''}
          ratio="4 / 3"
          className={styles.splitMedia}
        />
      </Container>
    </section>
  );
}
