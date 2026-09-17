/**
 * O que conta como manifestação de demonstração.
 *
 * Definição única, importada por quem acusa (`scripts/verificar-implantacao.js`)
 * e por quem apaga (`prisma/seed-demo-limpar.js`). Duas cópias do mesmo filtro
 * é o caminho para uma delas ser afrouxada sozinha — e a que apaga não pode
 * divergir da que audita.
 *
 * Exige as duas marcas que só `seed-demo.js` produz:
 * - o sufixo "(demo N)" no assunto;
 * - contato em `@exemplo.invalid`, domínio reservado que nunca existe de fato.
 *
 * Com apenas uma delas, um cliente que escrevesse "(demo " num assunto perderia
 * um registro real.
 */
export function manifestacoesDeDemonstracao(companyId) {
  if (!companyId) {
    // Sem empresa o filtro alcançaria o banco inteiro. Num banco com mais de
    // uma implantação isso apagaria dado alheio, então é erro de programação,
    // não um caso a tratar em silêncio.
    throw new Error('O filtro de demonstração exige companyId.');
  }

  return {
    companyId,
    title: { contains: '(demo ' },
    contactEmail: { endsWith: '@exemplo.invalid' },
  };
}
