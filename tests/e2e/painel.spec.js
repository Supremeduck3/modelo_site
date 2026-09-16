import { expect, test } from '@playwright/test';

/**
 * Fluxos críticos do bloco 3: ninguém entra no painel sem sessão, e quem tem
 * credencial válida entra, vê o panorama e consegue sair.
 *
 * As credenciais vêm do ambiente porque o molde não tem usuário padrão. Sem
 * elas, só a parte que não depende de login roda.
 */
const EMAIL = process.env.E2E_PANEL_EMAIL ?? process.env.SEED_ADMIN_EMAIL;
const PASSWORD =
  process.env.E2E_PANEL_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;

test('painel sem sessão manda para o login e guarda o destino', async ({
  page,
}) => {
  await page.goto('/painel');

  await expect(page).toHaveURL(/\/painel\/login\?next=%2Fpainel$/);
  await expect(
    page.getByRole('heading', { name: /painel da empresa/i, level: 1 }),
  ).toBeVisible();
});

test('credencial errada não revela se o e-mail existe', async ({ page }) => {
  await page.goto('/painel/login');

  await page.getByLabel('E-mail').fill('ninguem@exemplo.invalid');
  await page.getByLabel('Senha').fill('senha-errada-qualquer');
  await page.getByRole('button', { name: /entrar/i }).click();

  // `getByRole('alert')` também pega o anunciador de rota do Next, que é vazio.
  const alerta = page.getByRole('alert').filter({ hasText: /./ });
  await expect(alerta).toContainText(/e-mail ou senha incorretos/i);
  // Continua no login, sem sessão.
  await expect(page).toHaveURL(/\/painel\/login/);
});

test.describe('com credencial válida', () => {
  test.skip(
    !EMAIL || !PASSWORD,
    'Defina E2E_PANEL_EMAIL e E2E_PANEL_PASSWORD (ou rode o seed com SEED_ADMIN_*).',
  );

  test('equipe entra no painel, vê o panorama e sai', async ({ page }) => {
    await page.goto('/painel');
    await expect(page).toHaveURL(/\/painel\/login/);

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    // Voltou ao destino guardado no next, já autenticado.
    await expect(page).toHaveURL(/\/painel$/);
    await expect(
      page.getByRole('heading', { name: 'Início', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('Manifestações recebidas')).toBeVisible();

    await page.locator('header').getByRole('button').first().click();
    await page.getByRole('menuitem', { name: /sair/i }).click();

    await expect(page).toHaveURL(/\/painel\/login/);

    // Depois de sair, o painel volta a ser inacessível.
    await page.goto('/painel');
    await expect(page).toHaveURL(/\/painel\/login/);
  });

  test('login descarta destino externo no next', async ({ page }) => {
    // Tentativa de usar o login da empresa como trampolim para outro site.
    await page.goto('/painel/login?next=https://golpe.example/pwned');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/painel$/);
  });
});
