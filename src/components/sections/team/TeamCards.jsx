import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './team.module.css';

/** Variante em cartões com foto, nome, cargo e bio curta. */
export default function TeamCards({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.cardsGrid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <article key={`${item.name}-${index}`} className={styles.card}>
            <Media
              src={item.photo}
              alt={item.name ?? ''}
              ratio="1 / 1"
              className={styles.photo}
            />
            <h3 className={styles.name}>{item.name}</h3>
            {item.role && <p className={styles.role}>{item.role}</p>}
            {item.bio && <p className={styles.bio}>{item.bio}</p>}
          </article>
        ))}
      </div>
    </Section>
  );
}
