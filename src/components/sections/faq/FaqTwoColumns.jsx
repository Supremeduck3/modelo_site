import Section from '@/components/ui/Section';
import styles from './faq.module.css';

/** Variante que distribui as perguntas em duas colunas. */
export default function FaqTwoColumns({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  const half = Math.ceil(items.length / 2);
  const columns = [items.slice(0, half), items.slice(half)];

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <div className={styles.columns}>
        {columns.map((column, columnIndex) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: colunas fixas e estáveis
          <div key={columnIndex} className={styles.column}>
            {column.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: perguntas não têm identificador estável
              <div key={index} className={styles.block}>
                <h3 className={styles.blockQuestion}>{item.question}</h3>
                <p className={styles.blockAnswer}>{item.answer}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
