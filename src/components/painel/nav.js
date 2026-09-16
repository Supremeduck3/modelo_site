/**
 * Itens do menu do painel, na ordem em que aparecem.
 *
 * Lista única para a navegação e para o título da página atual: uma rota nova
 * (categorias e configurações) entra aqui e aparece nos dois lugares.
 */
export const PANEL_NAV = [
  { key: '/painel', label: 'Início' },
  { key: '/painel/manifestacoes', label: 'Manifestações' },
  { key: '/painel/equipe', label: 'Equipe' },
];

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
