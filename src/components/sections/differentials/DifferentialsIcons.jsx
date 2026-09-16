import Icon from '@/components/ui/Icon';
import Section from '@/components/ui/Section';
import styles from './differentials.module.css';

/** Variante compacta: ícone + título + descrição em grade. */
export default function DifferentialsIcons({ id, content = {} }) {
  const { title, items = [] } = content;

  return (
    <Section id={id} title={title} align="center">
      <div className={styles.iconsGrid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <div key={`${item.title}-${index}`} className={styles.iconItem}>
            <Icon icon={item.icon} />
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
