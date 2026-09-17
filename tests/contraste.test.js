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
  // Texto sobre a cor primária: é o texto dos botões, sempre em corpo maior.
  ['primaryContrast', 'primary', 3],
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
