import { expect, test } from '@playwright/test';
import { PAINEL_STORAGE_STATE } from './storage';

/**
 * Responsividade: nenhuma tela pode vazar para o lado no celular.
 *
 * Rolagem horizontal é o defeito que mais aparece em site de empresa pequena,
 * porque quase todo visitante chega pelo celular e basta um bloco de largura
 * fixa — uma tabela, uma imagem, um título muito largo — para a página inteira
 * balançar. É barato de medir e regride calado, então fica no automático.
 *
 * A medida é a da própria janela: se o documento rola além dela, sobra
 * conteúdo fora da tela. A tolerância de 1px absorve arredondamento de
 * subpixel do próprio navegador, não descuido de layout.
 */
const CELULAR = { width: 390, height: 844 };
const TOLERANCIA = 1;

async function medirVazamento(page, caminho) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(CELULAR);
  await page.goto(caminho);

  // As seções entram com opacidade: sem forçá-las visíveis, um bloco largo
  // ainda não revelado não entraria na medição.
  await page.addStyleTag({
    content: '[data-reveal]{opacity:1 !important;transform:none !important}',
  });

  /*
   * Medir logo depois do `goto` lia o layout do HTML do servidor, que não
   * conhece a largura da janela — no painel isso acusava a barra lateral
   * inteira como vazamento, quando na verdade ela se recolhe na hidratação.
   *
   * Em vez de adivinhar um tempo, esperamos a medida caber: o que interessa é
   * a página que o visitante enxerga depois de carregada. Se nunca couber, o
   * laço termina e a asserção abaixo falha com os culpados.
   */
  await page
    .waitForFunction(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      null,
      { timeout: 5000 },
    )
    .catch(() => {});

  return page.evaluate(() => {
    const doc = document.documentElement;
    const largura = Math.max(doc.scrollWidth, document.body.scrollWidth);

    // Quando há vazamento, aponta o culpado: sem isso o teste diz que algo
    // está errado e deixa a busca para quem for corrigir.
    const culpados = [];
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        culpados.push(
          `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''} (${Math.round(r.left)}→${Math.round(r.right)})`,
        );
      }
      if (culpados.length >= 5) break;
    }

    return { largura, janela: window.innerWidth, culpados };
  });
}

const PAGINAS_PUBLICAS = [
  ['home', '/'],
  ['canal de manifestações', '/manifestacao'],
  ['política de privacidade', '/privacidade'],
  ['login do painel', '/painel/login'],
];

for (const [nome, caminho] of PAGINAS_PUBLICAS) {
  test(`${nome} não rola para o lado no celular`, async ({ page }) => {
    const { largura, janela, culpados } = await medirVazamento(page, caminho);

    expect(
      largura,
      culpados.length > 0 ? `\n  vazando: ${culpados.join('\n  ')}` : '',
    ).toBeLessThanOrEqual(janela + TOLERANCIA);
  });
}

test.describe('painel autenticado', () => {
  test.use({ storageState: PAINEL_STORAGE_STATE });

  for (const [nome, caminho] of [
    ['início', '/painel'],
    ['manifestações', '/painel/manifestacoes'],
    ['equipe', '/painel/equipe'],
    ['categorias', '/painel/categorias'],
    ['configurações', '/painel/configuracoes'],
  ]) {
    test(`${nome} não rola para o lado no celular`, async ({ page }) => {
      const { largura, janela, culpados } = await medirVazamento(page, caminho);

      expect(
        largura,
        culpados.length > 0 ? `\n  vazando: ${culpados.join('\n  ')}` : '',
      ).toBeLessThanOrEqual(janela + TOLERANCIA);
    });
  }
});
