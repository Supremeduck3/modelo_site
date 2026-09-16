import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './team.module.css';

/** Variante em lista horizontal compacta. */
export default function TeamList({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <li key={`${item.name}-${index}`} className={styles.listItem}>
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
