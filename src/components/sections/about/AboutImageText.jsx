import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './about.module.css';

/** Variante imagem + texto lado a lado (empilha em mobile). */
export default function AboutImageText({ id, content = {} }) {
  const { title, subtitle, text, image } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <div className={styles.imageTextGrid}>
        <Media src={image} alt={title || 'Sobre'} className={styles.image} />
        {text && <p className={styles.text}>{text}</p>}
      </div>
    </Section>
  );
}
