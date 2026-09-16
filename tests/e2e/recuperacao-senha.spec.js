import { expect, test } from '@playwright/test';

/**
 * Fluxo de recuperação de senha.
 *
 * O que dá para verificar sem segredo: o caminho até o formulário, a resposta
 * neutra do pedido e a recusa de um link inválido. A redefinição com token
 * válido depende de um token entregue por e-mail e é coberta pelos testes de
 * unidade e pela verificação contra o banco.
 */

test('do login dá para chegar à recuperação', async ({ page }) => {
  await page.goto('/painel/login');

  await page.getByRole('link', { name: /esqueci minha senha/i }).click();

  await expect(page).toHaveURL(/\/painel\/esqueci-senha$/);
  await expect(
    page.getByRole('heading', { name: /recuperar acesso/i, level: 1 }),
  ).toBeVisible();
});

test('pedido responde igual para e-mail que não existe', async ({ page }) => {
  await page.goto('/painel/esqueci-senha');

  await page.getByLabel('E-mail').fill('ninguem@exemplo.invalid');
  await page.getByRole('button', { name: /enviar|recuperar/i }).click();

  // A confirmação não pode afirmar que o e-mail existe nem que foi enviado.
  const confirmacao = page.getByRole('status');
  await expect(confirmacao).toBeVisible();
  await expect(confirmacao).toContainText(/se houver uma conta/i);
});

test('e-mail malformado é barrado antes de chamar a API', async ({ page }) => {
  let chamouApi = false;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/forgot-password')) chamouApi = true;
  });

  await page.goto('/painel/esqueci-senha');
  await page.getByLabel('E-mail').fill('nao-e-email');
  await page.getByRole('button', { name: /enviar|recuperar/i }).click();

  await expect(page.getByText(/informe um e-mail válido/i)).toBeVisible();
  expect(chamouApi).toBe(false);
});

test('link sem token mostra recusa e oferece pedir outro', async ({ page }) => {
  await page.goto('/painel/redefinir-senha');

  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /pedir|novo link|recuperar/i }).first(),
  ).toBeVisible();
});
