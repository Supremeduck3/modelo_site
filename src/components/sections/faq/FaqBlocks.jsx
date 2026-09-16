import Section from '@/components/ui/Section';
import styles from './faq.module.css';

/** Variante em blocos independentes, todos sempre visíveis. */
export default function FaqBlocks({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.blocksGrid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: perguntas não têm identificador estável
          <div key={index} className={styles.block}>
            <h3 className={styles.blockQuestion}>{item.question}</h3>
            <p className={styles.blockAnswer}>{item.answer}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
