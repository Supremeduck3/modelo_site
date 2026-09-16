import Section from '@/components/ui/Section';
import DifferentialIcon from './DifferentialIcon';
import styles from './differentials.module.css';

/** Variante em cartões com sombra e destaque visual maior. */
export default function DifferentialsCards({ id, content = {} }) {
  const { title, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} />;
  }

  return (
    <Section id={id} title={title} align="center">
      <div className={styles.cardsGrid}>
        {items.map((item) => (
          <article key={item.title} className={styles.card}>
            <DifferentialIcon icon={item.icon} />
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
