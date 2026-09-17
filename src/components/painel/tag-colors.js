/**
 * Cores sólidas das etiquetas do painel.
 *
 * As cores nomeadas do Ant Design (`color="green"`) pintam texto médio sobre
 * fundo muito claro e medem em torno de 3,4:1 — abaixo do mínimo de 4,5:1 do
 * WCAG AA para o tamanho usado nas tabelas. Como o painel é ferramenta de
 * trabalho, usada o dia inteiro, trocamos por cor sólida: o antd escreve texto
 * branco sobre cor personalizada, e cada valor aqui foi medido contra o branco.
 *
 * O contraste de cada uma é conferido por teste (tests/contraste.test.js).
 */
export const TAG_SOLIDO = {
  /** 5,59:1 */
  verde: '#237804',
  /** 7,75:1 */
  vermelho: '#a8071a',
  /** 5,43:1 */
  laranja: '#ad4e00',
  /** 6,16:1 */
  azul: '#0958d9',
  /** 7,00:1 */
  cinza: '#595959',
  /** 9,85:1 */
  roxo: '#531dab',
};
