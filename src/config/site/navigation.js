/**
 * Navegação resolvida contra o que a implantação realmente mostra.
 *
 * Os itens do menu são escritos à mão na configuração, e desligar uma
 * funcionalidade (`features.booking: false`) ou tirar uma seção da home não
 * mexia neles: o menu continuava oferecendo "Agendar" para uma página que dá
 * 404, ou "Preços" para uma âncora que não existe. Aqui cada item é conferido:
 *
 * - âncora de seção (`#precos`) só fica se a home renderiza uma seção com esse
 *   id — e vira `/#precos`, para funcionar de qualquer página. Escrita como
 *   `#precos`, ela é relativa à página atual: em /agendar, o clique ia para
 *   /agendar#precos e não acontecia nada;
 * - página que depende de funcionalidade (/agendar, /manifestacao) só fica com
 *   a funcionalidade ligada. O mesmo vale para o botão de destaque (CTA).
 *
 * Função pura: recebe a configuração e as seções já filtradas, devolve a
 * navegação nova e a lista do que saiu (para avisar em desenvolvimento).
 */

/** Páginas que só existem com uma funcionalidade ligada. */
const PAGINA_DA_FUNCIONALIDADE = [
  { prefixo: '/agendar', flag: 'booking' },
  { prefixo: '/manifestacao', flag: 'submissions' },
];

function ancoraDe(href) {
  if (href.startsWith('#')) return href.slice(1);
  if (href.startsWith('/#')) return href.slice(2);
  return null;
}

/**
 * Diz se o link aponta para algo que existe e devolve o href corrigido, ou
 * `null` se o link deve sair.
 */
function resolverHref(href, { features, sectionIds }) {
  if (typeof href !== 'string' || href === '') return null;

  const ancora = ancoraDe(href);
  if (ancora !== null) {
    // `#` sozinho ou `/#` é "topo da home".
    if (ancora === '') return '/';
    return sectionIds.has(ancora) ? `/#${ancora}` : null;
  }

  const caminho = href.split(/[?#]/)[0];
  const dependencia = PAGINA_DA_FUNCIONALIDADE.find(
    ({ prefixo }) => caminho === prefixo || caminho.startsWith(`${prefixo}/`),
  );
  if (dependencia && features[dependencia.flag] === false) return null;

  return href;
}

export function resolveNavigation(navigation, { features, sections }) {
  const sectionIds = new Set(
    sections.map((section) => section.id ?? section.type),
  );
  const contexto = { features, sectionIds };
  const removidos = [];

  const items = (navigation.items ?? []).flatMap((item) => {
    const href = resolverHref(item.href, contexto);
    if (href === null) {
      removidos.push(item.label);
      return [];
    }
    return [{ ...item, href }];
  });

  let { showCta, ctaHref } = navigation;
  if (showCta) {
    const resolvido = resolverHref(ctaHref, contexto);
    if (resolvido === null) {
      removidos.push(`${navigation.ctaLabel} (botão)`);
      showCta = false;
    } else {
      ctaHref = resolvido;
    }
  }

  return { navigation: { ...navigation, items, showCta, ctaHref }, removidos };
}
