import Section from '@/components/ui/Section';
import DifferentialIcon from './DifferentialIcon';
import styles from './differentials.module.css';

/** Variante em duas colunas: metade dos itens de cada lado. */
export default function DifferentialsSideBlocks({ id, content = {} }) {
  const { title, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} />;
  }

  const half = Math.ceil(items.length / 2);
  const columns = [items.slice(0, half), items.slice(half)];

  return (
    <Section id={id} title={title}>
      <div className={styles.sideBlocks}>
        {columns.map((column, columnIndex) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: colunas fixas e estáveis
          <div key={columnIndex} className={styles.sideColumn}>
            {column.map((item) => (
              <div key={item.title} className={styles.sideItem}>
                <DifferentialIcon icon={item.icon} />
                <div>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  {item.description && (
                    <p className={styles.itemDescription}>{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
