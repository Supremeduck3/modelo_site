import Icon from '@/components/ui/Icon';
import Section from '@/components/ui/Section';
import styles from './services.module.css';

/** Variante em lista vertical, compacta. */
export default function ServicesList({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <li key={`${item.title}-${index}`} className={styles.listItem}>
            <Icon icon={item.icon} />
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
