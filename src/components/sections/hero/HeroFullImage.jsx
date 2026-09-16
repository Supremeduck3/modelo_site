import Container from '@/components/ui/Container';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/** Imagem de fundo ocupando a dobra, com overlay para manter contraste. */
export default function HeroFullImage({ id, content = {} }) {
  return (
    <section
      id={id}
      className={styles.fullImage}
      style={
        content.image ? { backgroundImage: `url(${content.image})` } : undefined
      }
    >
      <div className={styles.overlay} />
      <Container className={styles.fullImageInner}>
        <HeroContent content={content} inverted />
      </Container>
    </section>
  );
}
