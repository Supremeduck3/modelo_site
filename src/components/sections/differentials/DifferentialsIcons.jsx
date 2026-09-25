import Icon from '@/components/ui/Icon';
import Section from '@/components/ui/Section';
import styles from './differentials.module.css';

/**
 * Variante compacta: ícone + título + descrição em grade.
 *
 * Sem ícone configurado, o item ganha a posição numerada ("01") como marcador:
 * só título e descrição sob um filete deixavam a seção parecendo inacabada ao
 * lado das outras. Número não finge significado que o conteúdo não tem.
 */
export default function DifferentialsIcons({ id, content = {} }) {
  const { title, items = [] } = content;

  return (
    <Section id={id} title={title}>
      <div className={styles.iconsGrid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <div key={`${item.title}-${index}`} className={styles.iconItem}>
            {item.icon ? (
              <Icon icon={item.icon} />
            ) : (
              <span className={styles.ordinal} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
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
