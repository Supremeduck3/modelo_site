import Section from '@/components/ui/Section';
import styles from './about.module.css';

/** Variante simples: título/subtítulo (via Section) + texto corrido. */
export default function AboutSimple({ id, content = {} }) {
  const { title, subtitle, text } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      {text && <p className={styles.text}>{text}</p>}
    </Section>
  );
}
