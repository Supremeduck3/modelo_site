import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CONFIG } from '../src/config/site/schema.js';
import { THEME_PRESETS } from '../src/config/theme/presets.js';

/**
 * Contraste dos tokens de texto, conferido contra o fundo do próprio tema.
 *
 * Existe porque contraste é o que regride sem ninguém notar: alguém clareia um
 * cinza para o layout "respirar" e o texto secundário deixa de ser legível para
 * quem não tem visão perfeita — e nenhum teste de comportamento reclama.
 *
 * O mínimo é o do WCAG AA: 4,5:1 para texto normal e 3:1 para texto grande.
 */

/** Luminância relativa, conforme a definição do WCAG. */
function luminancia(hex) {
  const limpo = hex.replace('#', '');
  const canais = [0, 2, 4].map(
    (i) => Number.parseInt(limpo.slice(i, i + 2), 16) / 255,
  );

  const linear = canais.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contraste(corA, corB) {
  const a = luminancia(corA);
  const b = luminancia(corB);
  const claro = Math.max(a, b);
  const escuro = Math.min(a, b);
  return (claro + 0.05) / (escuro + 0.05);
}

test('a função de contraste concorda com os extremos conhecidos', () => {
  assert.equal(Math.round(contraste('#000000', '#ffffff')), 21);
  assert.equal(Math.round(contraste('#ffffff', '#ffffff')), 1);
});

/** Pares que precisam passar, e o mínimo de cada um. */
const EXIGENCIAS = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['textMuted', 'background', 4.5],
  ['textMuted', 'surface', 4.5],
  /*
   * Texto sobre a cor primária a 4,5:1, não 3:1 (o mínimo de corpo grande):
   * `--on-dark-muted` usa essa cor em parágrafo dentro dos blocos de fundo
   * colorido (hero invertido, serviços, contato, canal). Exigir 3 aqui
   * deixaria passar verde exatamente a regressão que motivou este teste.
   */
  ['primaryContrast', 'primary', 4.5],
  // Estados aparecem como texto (mensagem de erro, rótulo de etiqueta).
  ['success', 'background', 4.5],
  ['danger', 'background', 4.5],
  ['warning', 'background', 4.5],
  // Borda de campo é componente de interface: 3:1 (WCAG 1.4.11).
  ['borderStrong', 'background', 3],
];

const TEMAS = {
  padrao: DEFAULT_CONFIG.theme.colors,
  ...Object.fromEntries(
    Object.entries(THEME_PRESETS).map(([nome, preset]) => [
      nome,
      { ...DEFAULT_CONFIG.theme.colors, ...preset.colors },
    ]),
  ),
};

for (const [nome, cores] of Object.entries(TEMAS)) {
  test(`tema "${nome}" tem contraste suficiente nos textos`, () => {
    for (const [frente, fundo, minimo] of EXIGENCIAS) {
      const corFrente = cores[frente];
      const corFundo = cores[fundo];

      assert.ok(
        corFrente && corFundo,
        `tema "${nome}" não define ${frente} ou ${fundo}`,
      );

      const razao = contraste(corFrente, corFundo);
      assert.ok(
        razao >= minimo,
        `tema "${nome}": ${frente} (${corFrente}) sobre ${fundo} (${corFundo}) dá ${razao.toFixed(2)}:1, mínimo ${minimo}:1`,
      );
    }
  });
}

test('etiquetas sólidas do painel têm contraste sobre o texto branco', async () => {
  const { TAG_SOLIDO } = await import('../src/components/painel/tag-colors.js');

  // O antd escreve texto branco sobre cor personalizada, então é esse o par a
  // medir. Substituem as cores nomeadas do antd, que ficavam em ~3,4:1.
  for (const [nome, cor] of Object.entries(TAG_SOLIDO)) {
    const razao = contraste('#ffffff', cor);
    assert.ok(
      razao >= 4.5,
      `etiqueta "${nome}" (${cor}) dá ${razao.toFixed(2)}:1 com texto branco, mínimo 4,5:1`,
    );
  }
});

/*
 * Percorrer só `TAG_SOLIDO` mede as cores que já foram corrigidas e ignora a
 * que ficou de fora: `in_progress` seguia com cor nomeada do antd
 * (`processing`, ~3,4:1) e o teste passava verde — justamente o status mais
 * comum de um atendimento em curso. Aqui a fonte é a tela.
 */
test('nenhuma etiqueta do painel usa cor nomeada do Ant Design', async () => {
  const arquivos = [
    'src/components/painel/SubmissionsTable.jsx',
    'src/components/painel/TeamTable.jsx',
    'src/components/painel/SubmissionTimeline.jsx',
    'src/components/painel/CategoriesManager.jsx',
  ];

  const { readFile } = await import('node:fs/promises');
  const nomeada = /^\s*(\w+):\s*'(?!#)([a-z-]+)',/gm;

  for (const arquivo of arquivos) {
    const conteudo = await readFile(
      new URL(`../${arquivo}`, import.meta.url),
      'utf8',
    );

    for (const bloco of conteudo.matchAll(
      /const \w*(?:COLOR|CORES)\w*\s*=\s*\{([^}]*)\}/g,
    )) {
      for (const achado of bloco[1].matchAll(nomeada)) {
        assert.fail(
          `${arquivo}: etiqueta "${achado[1]}" usa a cor nomeada "${achado[2]}" do antd, que não é medida. Use TAG_SOLIDO.`,
        );
      }
    }
  }
});

test('botão de WhatsApp tem contraste com o ícone branco', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(
    new URL(
      '../src/components/layout/whatsapp-button.module.css',
      import.meta.url,
    ),
    'utf8',
  );
  const cor = /--whatsapp:\s*(#[0-9a-f]{6})/i.exec(css)?.[1];
  assert.ok(cor, 'a cor do botão precisa estar em --whatsapp');

  // Ícone é elemento gráfico (mínimo 3:1), mas o rótulo em tela larga é texto:
  // exigimos o mínimo de texto, 4,5:1.
  const razao = contraste('#ffffff', cor);
  assert.ok(
    razao >= 4.5,
    `botão de WhatsApp (${cor}) dá ${razao.toFixed(2)}:1 com branco, mínimo 4,5:1`,
  );
});
