import Section from '@/components/ui/Section';
import ServiceIcon from './ServiceIcon';
import styles from './services.module.css';

/** Variante em cartões com ícone, título e descrição. */
export default function ServicesCards({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.cardsGrid}>
        {items.map((item) => (
          <article key={item.title} className={styles.card}>
            <ServiceIcon icon={item.icon} />
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.description && (
              <p className={styles.cardDescription}>{item.description}</p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
