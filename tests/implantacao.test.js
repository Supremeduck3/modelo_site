import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * Regras da verificação de implantação que não podem regredir.
 *
 * Os dois filtros testados aqui alimentam decisões destrutivas ou bloqueantes:
 * um acusa "isto ainda é o molde" e o outro apaga registros. Um falso positivo
 * em qualquer um deles atinge dado de cliente real.
 */

/** Espelha RESQUICIOS_DO_MOLDE de scripts/verificar-implantacao.js. */
const RESQUICIOS = [
  /\bdemo servi[çc]os\b/i,
  /\bempresa demonstrativa\b/i,
  /\bsua empresa\b/i,
  /exemplo\.(com|com\.br|invalid)\b/i,
  /(^|\s)demo(\s|$)/i,
];

const pareceDoMolde = (valor) =>
  typeof valor === 'string' &&
  valor.trim() !== '' &&
  RESQUICIOS.some((padrao) => padrao.test(valor));

test('acusa os valores que acompanham o molde', () => {
  for (const valor of [
    'Demo Serviços',
    'Demo Servicos',
    'Empresa demonstrativa usada para exercitar o molde',
    'Sua Empresa',
    'contato@exemplo.com.br',
    'visitante@exemplo.invalid',
  ]) {
    assert.ok(pareceDoMolde(valor), `deveria acusar: ${valor}`);
  }
});

test('não acusa nome real que apenas contém "demo" como sílaba', () => {
  // Regressão: com busca por substring, "Demolidora Silva" era reprovada e o
  // implementador seria mandado corrigir um nome que já estava certo.
  for (const valor of [
    'Demolidora Silva',
    'demolicao@cliente.com.br',
    'Demóstenes Consultoria',
    'Marcenaria Andrade',
    'contato@padariacentral.com.br',
  ]) {
    assert.equal(pareceDoMolde(valor), false, `não deveria acusar: ${valor}`);
  }
});

test('valor vazio ou ausente não é resquício', () => {
  for (const valor of ['', '   ', null, undefined, 42]) {
    assert.equal(pareceDoMolde(valor), false);
  }
});

test('manifestação de demonstração exige as duas marcas', async () => {
  const { manifestacoesDeDemonstracao } = await import(
    '../prisma/demo-marker.js'
  );

  const filtro = manifestacoesDeDemonstracao('empresa-1');

  // As duas marcas juntas: sem isso, um cliente que escrevesse "(demo " num
  // assunto teria o registro apagado pelo comando de limpeza.
  assert.equal(filtro.companyId, 'empresa-1');
  assert.deepEqual(filtro.title, { contains: '(demo ' });
  assert.deepEqual(filtro.contactEmail, { endsWith: '@exemplo.invalid' });
});

test('carregador de .env entende as formas comuns de escrever', () => {
  // Replica o parser de scripts/verificar-implantacao.js. As formas abaixo
  // aparecem em arquivos reais; qualquer uma mal lida faz o verificador
  // reprovar uma implantação que está correta.
  const ler = (conteudo) => {
    const out = {};
    for (const linha of conteudo.split('\n')) {
      const limpa = linha.trim();
      if (limpa === '' || limpa.startsWith('#')) continue;

      const separador = limpa.indexOf('=');
      if (separador === -1) continue;

      const chave = limpa
        .slice(0, separador)
        .trim()
        .replace(/^export\s+/, '');
      const valor = limpa
        .slice(separador + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      out[chave] = valor;
    }
    return out;
  };

  const lido = ler(
    [
      '# comentário',
      'COM_ASPAS="valor"',
      "ASPAS_SIMPLES='valor'",
      'SEM_ASPAS=valor',
      'COM_IGUAL=postgres://u:p@host:5432/db?x=1&y=2',
      'export EXPORTADA=ok',
      '  ESPACO_ANTES=ok',
      'VAZIA=',
      'SEM_IGUAL',
    ].join('\n'),
  );

  assert.equal(lido.COM_ASPAS, 'valor');
  assert.equal(lido.ASPAS_SIMPLES, 'valor');
  assert.equal(lido.SEM_ASPAS, 'valor');
  assert.equal(
    lido.COM_IGUAL,
    'postgres://u:p@host:5432/db?x=1&y=2',
    'o = dentro do valor não pode virar separador',
  );
  assert.equal(lido.EXPORTADA, 'ok', 'export precisa ser reconhecido');
  assert.equal(lido.ESPACO_ANTES, 'ok');
  assert.equal(lido.VAZIA, '');
  assert.equal('SEM_IGUAL' in lido, false);
  assert.equal('# comentário' in lido, false);
});

test('o filtro de demonstração recusa rodar sem empresa', async () => {
  const { manifestacoesDeDemonstracao } = await import(
    '../prisma/demo-marker.js'
  );

  // Sem companyId o filtro alcançaria o banco inteiro — e ele alimenta um
  // comando que apaga. Num banco com mais de uma implantação, isso removeria
  // dado alheio.
  assert.throws(() => manifestacoesDeDemonstracao(), /companyId/);
  assert.throws(() => manifestacoesDeDemonstracao(''), /companyId/);
  assert.throws(() => manifestacoesDeDemonstracao(null), /companyId/);
});
