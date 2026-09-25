/**
 * Formatação da tabela de serviços.
 *
 * Arquivo sem dependência nenhuma de propósito: é usado no site público, no
 * formulário de agendamento e no painel, e não pode arrastar biblioteca de
 * validação para o navegador.
 */

const REAL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Preço para exibição.
 *
 * `null` é "sob consulta", não zero: um serviço de R$ 0 existe (retoque em
 * garantia) e não pode ser confundido com um que não tem preço fechado.
 */
export function formatPrice(priceCents, priceFrom = false) {
  if (priceCents === null || priceCents === undefined) return 'Sob consulta';
  const valor = REAL.format(priceCents / 100);
  return priceFrom ? `a partir de ${valor}` : valor;
}

/** Duração curta: "40 min", "1h", "1h30". */
export function formatDuration(minutes) {
  if (!Number.isInteger(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const horas = Math.floor(minutes / 60);
  const resto = minutes % 60;
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
}

/**
 * Lê o preço digitado no painel e devolve centavos.
 *
 * Aceita o jeito brasileiro de escrever ("35", "35,9", "35,90",
 * "R$ 1.234,50"). Vazio é `null` (sob consulta). Texto que não é preço devolve
 * `NaN`, para a validação recusar com mensagem em vez de gravar zero.
 *
 * Trabalha sobre o texto, sem `parseFloat` no meio: 0,1 + 0,2 em ponto
 * flutuante não é 0,3, e em dinheiro isso vira centavo sumindo.
 */
export function parsePriceToCents(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) ? Math.round(input * 100) : Number.NaN;
  }

  const texto = String(input).replace(/r\$/i, '').replace(/\s/g, '').trim();
  if (texto === '') return null;

  /*
   * "35.90" também vale: teclado numérico de celular muitas vezes só tem
   * ponto. Não há ambiguidade com milhar, que sempre tem três dígitos depois
   * do ponto ("1.234").
   */
  const comPonto = /^(\d+)\.(\d{1,2})$/.exec(texto);
  if (comPonto) {
    return Number(comPonto[1]) * 100 + Number(comPonto[2].padEnd(2, '0'));
  }

  // Ponto como separador de milhar; vírgula como decimal.
  const match = /^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/.exec(texto);
  if (!match) return Number.NaN;

  const reais = Number(match[1].replace(/\./g, ''));
  const centavos = Number((match[2] ?? '0').padEnd(2, '0'));
  return reais * 100 + centavos;
}

/** Centavos de volta para o campo do painel ("35,90"); `null` vira vazio. */
export function centsToInput(priceCents) {
  if (priceCents === null || priceCents === undefined) return '';
  const reais = Math.floor(priceCents / 100);
  const centavos = String(priceCents % 100).padStart(2, '0');
  return `${reais},${centavos}`;
}
