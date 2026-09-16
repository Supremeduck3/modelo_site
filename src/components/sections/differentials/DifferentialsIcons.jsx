import Section from '@/components/ui/Section';
import DifferentialIcon from './DifferentialIcon';
import styles from './differentials.module.css';

/** Variante compacta: ícone + título + descrição em grade. */
export default function DifferentialsIcons({ id, content = {} }) {
  const { title, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} />;
  }

  return (
    <Section id={id} title={title} align="center">
      <div className={styles.iconsGrid}>
        {items.map((item) => (
          <div key={item.title} className={styles.iconItem}>
            <DifferentialIcon icon={item.icon} />
            <h3 className={styles.itemTitle}>{item.title}</h3>
            {item.description && (
              <p className={styles.itemDescription}>{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
