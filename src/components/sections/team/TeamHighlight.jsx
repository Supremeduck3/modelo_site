import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './team.module.css';

/** Variante com o primeiro membro em destaque e os demais em lista lateral. */
export default function TeamHighlight({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  const [featured, ...rest] = items;

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <div className={styles.highlightGrid}>
        <article className={styles.featured}>
          <Media
            src={featured.photo}
            alt={featured.name ?? ''}
            ratio="1 / 1"
            className={styles.photo}
          />
          <h3 className={styles.name}>{featured.name}</h3>
          {featured.role && <p className={styles.role}>{featured.role}</p>}
          {featured.bio && <p className={styles.bio}>{featured.bio}</p>}
        </article>

        {rest.length > 0 && (
          <ul className={styles.list}>
            {rest.map((item) => (
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
        )}
      </div>
    </Section>
  );
}
