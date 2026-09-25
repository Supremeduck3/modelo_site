import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { features } from '@/config/site';
import { formatDuration, formatPrice } from '@/lib/catalog/format';
import { getPublicCatalog } from '@/server/modules/catalog/service';
import styles from './pricing.module.css';

/**
 * Tabela de serviços com preço, lida do banco.
 *
 * É a única seção da home que vem do banco em vez da configuração, porque
 * preço é dado da operação: muda toda semana e quem muda é a empresa, pelo
 * painel. A home continua estática; o painel pede a revalidação quando a
 * tabela muda (server/modules/catalog/revalidate.js).
 *
 * Banco fora do ar — ou a build rodando sem banco — tira a seção da página em
 * vez de derrubar a home: a tabela de preço é importante, mas não mais que o
 * resto do site.
 */
async function carregar() {
  try {
    return await getPublicCatalog();
  } catch (error) {
    console.error('[pricing] tabela de preços indisponível', error?.message);
    return null;
  }
}

function Item({ item, variant }) {
  const duracao = formatDuration(item.durationMinutes);

  return (
    <li className={variant === 'cards' ? styles.card : styles.row}>
      <div className={styles.line}>
        <h3 className={styles.name}>{item.name}</h3>
        {/* O filete pontilhado liga nome e preço, como no cardápio: o olho
            não se perde na linha em tela larga. */}
        {variant === 'list' && (
          <span className={styles.leader} aria-hidden="true" />
        )}
        <span className={styles.price}>
          {formatPrice(item.priceCents, item.priceFrom)}
        </span>
      </div>
      {(duracao || item.description) && (
        <p className={styles.details}>
          {duracao && <span className={styles.duration}>{duracao}</span>}
          {duracao && item.description && <span aria-hidden="true"> · </span>}
          {item.description}
        </p>
      )}
    </li>
  );
}

export default async function PricingSection({ id, variant, content = {} }) {
  if (!features.pricing) return null;

  const grupos = await carregar();
  // Tabela vazia não vira seção vazia na home: sem item, a seção some.
  if (!grupos || grupos.length === 0) return null;

  const tipo = variant === 'cards' ? 'cards' : 'list';
  const cta = features.booking && content.ctaLabel;

  return (
    <Section id={id} title={content.title} subtitle={content.subtitle}>
      <div className={tipo === 'cards' ? styles.groupsCards : styles.groups}>
        {grupos.map((grupo) => (
          <div key={grupo.category ?? 'geral'} className={styles.group}>
            {grupo.category && (
              <h3 className={styles.groupTitle}>{grupo.category}</h3>
            )}
            <ul className={tipo === 'cards' ? styles.cards : styles.rows}>
              {grupo.items.map((item) => (
                <Item key={item.id} item={item} variant={tipo} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {(content.note || cta) && (
        <div className={styles.footer}>
          {content.note && <p className={styles.note}>{content.note}</p>}
          {cta && (
            <Button href="/agendar" size="lg">
              {content.ctaLabel}
            </Button>
          )}
        </div>
      )}
    </Section>
  );
}
