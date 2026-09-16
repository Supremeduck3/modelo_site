import Icon from '@/components/ui/Icon';
import Section from '@/components/ui/Section';
import { splitInColumns } from '../columns';
import styles from './differentials.module.css';

/** Variante em duas colunas: metade dos itens de cada lado. */
export default function DifferentialsSideBlocks({ id, content = {} }) {
  const { title, items = [] } = content;

  const columns = splitInColumns(items, 2);

  return (
    <Section id={id} title={title}>
      <div className={styles.sideBlocks}>
        {columns.map((column, columnIndex) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: colunas fixas e estáveis
          <div key={columnIndex} className={styles.sideColumn}>
            {column.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
              <div key={`${item.title}-${index}`} className={styles.sideItem}>
                <Icon icon={item.icon} />
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
