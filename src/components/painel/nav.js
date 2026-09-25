/**
 * Itens do menu do painel, na ordem em que aparecem.
 *
 * Lista única para a navegação e para o título da página atual: uma rota nova
 * entra aqui e aparece nos dois lugares.
 */
export const PANEL_NAV = [
  { key: '/painel', label: 'Início' },
  // `feature`: o item só aparece com a funcionalidade ligada na implantação.
  { key: '/painel/agenda', label: 'Agenda', feature: 'booking' },
  { key: '/painel/manifestacoes', label: 'Manifestações' },
  { key: '/painel/servicos', label: 'Serviços e preços', feature: 'pricing' },
  { key: '/painel/equipe', label: 'Equipe' },
  { key: '/painel/categorias', label: 'Categorias' },
  { key: '/painel/configuracoes', label: 'Configurações' },
];

/**
 * Itens visíveis para as funcionalidades ligadas.
 *
 * Recebe o mapa de flags em vez de importar a configuração: o menu é
 * componente de cliente, e a configuração inteira não precisa ir ao navegador.
 */
export function visibleNavItems(enabled = {}) {
  return PANEL_NAV.filter((item) => !item.feature || enabled[item.feature]);
}

/**
 * Item correspondente ao caminho atual.
 *
 * Escolhe o item mais específico que prefixa o caminho, para que uma subrota
 * (`/painel/manifestacoes/123`) continue marcando a seção dela.
 */
export function activeNavItem(pathname) {
  return PANEL_NAV.filter(
    (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
  ).sort((a, b) => b.key.length - a.key.length)[0];
}
