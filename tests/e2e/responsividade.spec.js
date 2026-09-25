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
    content:
      // Os dois seletores, como no <noscript> de src/app/layout.js: só o
      // primeiro deixava os filhos de grade escalonada em opacidade 0 — e um
      // elemento invisível esconde o problema em vez de reportá-lo.
      '[data-reveal],[data-reveal] .stagger > *{opacity:1 !important;transform:none !important}',
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
  // O trilho de dias do agendamento já esticou a página para 1400px num
  // celular de 390px: rolagem horizontal dentro de grade é armadilha comum.
  ['agendamento', '/agendar'],
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

  // Sessão vencida redirecionaria para o login e os cinco testes mediriam a
  // mesma tela, com o nome de outra página. Ver acessibilidade.spec.js.
  test.beforeEach(async ({ page }) => {
    await page.goto('/painel');
    await expect(page).not.toHaveURL(/\/painel\/login/);
  });

  for (const [nome, caminho] of [
    ['início', '/painel'],
    ['manifestações', '/painel/manifestacoes'],
    ['equipe', '/painel/equipe'],
    ['categorias', '/painel/categorias'],
    ['configurações', '/painel/configuracoes'],
    ['agenda', '/painel/agenda'],
    ['serviços e preços', '/painel/servicos'],
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

/*
 * O menu do celular abria com 72px de altura e os links cortados: o cabeçalho
 * fixo tem `backdrop-filter`, que prende todo `position: fixed` descendente na
 * caixa dele. Nenhum outro teste pegava, porque o botão abria e o diálogo
 * existia — só não dava para usar. Aqui se exige o que o visitante precisa:
 * painel da altura da tela e os links à vista.
 */
test('menu do celular abre inteiro, com os links à vista', async ({ page }) => {
  await page.setViewportSize(CELULAR);
  await page.goto('/');

  await page.getByRole('button', { name: /menu/i }).first().click();

  const menu = page.getByRole('dialog', { name: 'Menu de navegação' });
  await expect(menu).toBeVisible();

  const altura = await menu.evaluate((el) => el.getBoundingClientRect().height);
  expect(altura).toBeGreaterThanOrEqual(CELULAR.height - 1);

  const links = menu.getByRole('navigation').getByRole('link');
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    await expect(link).toBeInViewport();
  }

  // Esc fecha e devolve o foco ao botão que abriu.
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});
