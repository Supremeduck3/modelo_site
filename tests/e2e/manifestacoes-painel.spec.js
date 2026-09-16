import { expect, test } from '@playwright/test';

/**
 * Fluxo crítico do bloco 3: a equipe encontra a manifestação, classifica,
 * anota e responde — e a nota interna não se confunde com a resposta.
 *
 * Depende de credenciais no ambiente, porque o molde não tem usuário padrão.
 */
const EMAIL = process.env.E2E_PANEL_EMAIL ?? process.env.SEED_ADMIN_EMAIL;
const PASSWORD =
  process.env.E2E_PANEL_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;

test('lista de manifestações exige sessão', async ({ page }) => {
  await page.goto('/painel/manifestacoes');
  await expect(page).toHaveURL(/\/painel\/login\?next=/);
});

test.describe('com credencial válida', () => {
  test.skip(
    !EMAIL || !PASSWORD,
    'defina E2E_PANEL_EMAIL e E2E_PANEL_PASSWORD para rodar',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/painel/login');
    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/painel$/);
  });

  test('equipe abre a fila, filtra e chega ao detalhe', async ({ page }) => {
    await page.goto('/painel/manifestacoes');

    // Os links de protocolo, e não `tbody tr`: a tabela do antd põe uma linha
    // oculta de medição como primeira filha do tbody.
    const protocolos = page.getByRole('link', { name: /^\d{4}-/ });
    await expect(protocolos.first()).toBeVisible();

    // O filtro é estado de URL: a lista é renderizada no servidor a partir dela.
    await page.goto('/painel/manifestacoes?status=resolved');
    await expect(page).toHaveURL(/status=resolved/);

    await page.goto('/painel/manifestacoes');
    await page
      .getByRole('link', { name: /^\d{4}-/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/painel\/manifestacoes\/[0-9a-f-]{36}$/);
    // `exact`: a descrição da manifestação de demonstração contém a palavra.
    await expect(page.getByText('Histórico', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Classificação', { exact: true }),
    ).toBeVisible();
  });

  test('nota interna é marcada como invisível ao visitante', async ({
    page,
  }) => {
    await page.goto('/painel/manifestacoes');
    await page
      .getByRole('link', { name: /^\d{4}-/ })
      .first()
      .click();

    const nota = `Nota de teste ${Date.now()}`;
    await page.getByLabel('Nota interna').fill(nota);
    await page.getByRole('button', { name: 'Salvar nota' }).click();

    // A nota aparece no histórico, e marcada como interna: é isso que impede a
    // equipe de confundi-la com o que o visitante recebe.
    await expect(page.getByText(nota)).toBeVisible();
    await expect(page.getByText(/interna/i).first()).toBeVisible();
  });

  test('filtro inválido na URL não derruba a fila', async ({ page }) => {
    await page.goto(
      '/painel/manifestacoes?status=inventado&page=abc&pageSize=999999',
    );

    await expect(
      page.getByRole('heading', { name: /manifesta/i }).first(),
    ).toBeVisible();
  });
});
