import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAINEL_STORAGE_STATE } from './storage';

/**
 * Acessibilidade automatizada das telas que qualquer implantação tem.
 *
 * Ferramenta automática não substitui conferência humana — ela pega uma fatia
 * do problema (contraste, rótulo ausente, hierarquia de cabeçalho, papel
 * inválido) e ignora o resto. Vale porque essa fatia é exatamente a que
 * regride sem ninguém notar, ao trocar um token de cor ou renomear um campo.
 *
 * O recorte é WCAG 2 A e AA, que é o que a especificação chama de
 * "acessibilidade básica conferida".
 */
const PADROES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Deixa a página estabilizar antes de medir.
 *
 * O molde revela seções com transição de opacidade. Auditar no meio dela faz a
 * ferramenta ler a cor misturada com o fundo e acusar contraste que não existe
 * na paleta — foi o que aconteceu na primeira execução: 35 falsos positivos de
 * `color-contrast`.
 *
 * `reducedMotion` zera as transições (o próprio molde respeita a preferência),
 * e a rolagem dispara os observadores das seções abaixo da dobra. É também uma
 * configuração que usuário real tem, então a medição vale por si.
 */
async function prepararPagina(page, caminho) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(caminho);

  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    window.scrollTo(0, 0);
  });

  // Garante que nada ficou invisível: uma seção em opacidade 0 esconderia
  // problemas em vez de reportá-los, e depender só do observador de scroll
  // deixava a home pendurada — há blocos que nunca entram na viewport do
  // tamanho usado no teste.
  await page.addStyleTag({
    content: '[data-reveal]{opacity:1 !important;transform:none !important}',
  });
}

async function auditar(page) {
  return new AxeBuilder({ page }).withTags(PADROES).analyze();
}

/** Mostra a regra e onde ela falhou, senão o relatório não ajuda a corrigir. */
function descrever(violacoes) {
  return violacoes
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' '))
          .join('\n    ')}`,
    )
    .join('\n  ');
}

const PAGINAS_PUBLICAS = [
  ['home', '/'],
  ['canal de manifestações', '/manifestacao'],
  ['política de privacidade', '/privacidade'],
  ['login do painel', '/painel/login'],
  ['recuperação de senha', '/painel/esqueci-senha'],
];

for (const [nome, caminho] of PAGINAS_PUBLICAS) {
  test(`${nome} sem violação de acessibilidade`, async ({ page }) => {
    await prepararPagina(page, caminho);
    const { violations } = await auditar(page);

    expect(
      violations,
      violations.length > 0 ? `\n  ${descrever(violations)}` : '',
    ).toEqual([]);
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
    test(`${nome} sem violação de acessibilidade`, async ({ page }) => {
      await prepararPagina(page, caminho);
      const { violations } = await auditar(page);

      expect(
        violations,
        violations.length > 0 ? `\n  ${descrever(violations)}` : '',
      ).toEqual([]);
    });
  }
});
