/**
 * Divide uma lista em N colunas de tamanhos equilibrados, preservando a ordem
 * de leitura de cima para baixo dentro de cada coluna.
 */
export function splitInColumns(items, count = 2) {
  const perColumn = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, index) =>
    items.slice(index * perColumn, (index + 1) * perColumn),
  );
}
