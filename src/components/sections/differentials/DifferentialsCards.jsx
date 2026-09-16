import Icon from '@/components/ui/Icon';
import Section from '@/components/ui/Section';
import styles from './differentials.module.css';

/** Variante em cartões com sombra e destaque visual maior. */
export default function DifferentialsCards({ id, content = {} }) {
  const { title, items = [] } = content;

  return (
    <Section id={id} title={title} align="center">
      <div className={styles.cardsGrid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <article key={`${item.title}-${index}`} className={styles.card}>
            <Icon icon={item.icon} />
            <h3 className={styles.itemTitle}>{item.title}</h3>
            {item.description && (
              <p className={styles.itemDescription}>{item.description}</p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
