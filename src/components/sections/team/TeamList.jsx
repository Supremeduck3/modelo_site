import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './team.module.css';

/** Variante em lista horizontal compacta. */
export default function TeamList({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.name} className={styles.listItem}>
            <Media
              src={item.photo}
              alt={item.name ?? ''}
              ratio="1 / 1"
              className={styles.listPhoto}
            />
            <div>
              <h3 className={styles.name}>{item.name}</h3>
              {item.role && <p className={styles.role}>{item.role}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
