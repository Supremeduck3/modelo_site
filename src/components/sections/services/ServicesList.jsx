import Section from '@/components/ui/Section';
import ServiceIcon from './ServiceIcon';
import styles from './services.module.css';

/** Variante em lista vertical, compacta. */
export default function ServicesList({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.title} className={styles.listItem}>
            <ServiceIcon icon={item.icon} />
            <div>
              <h3 className={styles.listItemTitle}>{item.title}</h3>
              {item.description && (
                <p className={styles.listItemDescription}>{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
