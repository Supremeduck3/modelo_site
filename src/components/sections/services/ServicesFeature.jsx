import Section from '@/components/ui/Section';
import styles from './services.module.css';

/**
 * Um serviço em destaque e os demais em lista ao lado.
 *
 * Existe para a implantação que não quer tratar todos os serviços como iguais:
 * o carro-chefe ocupa um bloco sólido e o restante vira leitura de apoio.
 * O destaque é o primeiro item da lista — a ordem do conteúdo é a hierarquia.
 */
export default function ServicesFeature({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;
  const [featured, ...rest] = items;

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <div className={styles.featureGrid}>
        <article className={styles.featureMain}>
          <p className={styles.featureBadge}>Destaque</p>
          <h3 className={styles.featureTitle}>{featured.title}</h3>
          {featured.description && (
            <p className={styles.featureDescription}>{featured.description}</p>
          )}
        </article>

        {rest.length > 0 && (
          <ul className={styles.featureList}>
            {rest.map((item, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
                key={`${item.title}-${index}`}
                className={styles.featureItem}
              >
                <h3 className={styles.listItemTitle}>{item.title}</h3>
                {item.description && (
                  <p className={styles.listItemDescription}>
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
