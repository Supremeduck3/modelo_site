import { expect, test } from '@playwright/test';

/**
 * Fluxo crítico do bloco 2: um visitante registra uma manifestação e recebe o
 * protocolo, sem intervenção manual.
 */
test('visitante registra manifestação e recebe protocolo', async ({ page }) => {
  await page.goto('/manifestacao');

  await expect(
    page.getByRole('heading', { name: /canal de manifesta/i, level: 1 }),
  ).toBeVisible();

  await page.getByRole('radio', { name: 'Reclamação' }).check();
  await page
    .getByLabel(/assunto/i)
    .fill('Atendimento demorado na unidade central');
  await page
    .getByLabel(/descri/i)
    .fill(
      'Aguardei mais de uma hora para ser atendido e ninguém informou a previsão de atendimento.',
    );
  await page.getByLabel(/e-mail/i).fill('visitante@exemplo.com');

  await page.getByRole('button', { name: /enviar/i }).click();

  // O toast também usa role=status; ancoramos no painel de confirmação.
  const confirmacao = page
    .getByRole('status')
    .filter({ hasText: /protocolo/i });
  await expect(confirmacao).toBeVisible();
  await expect(confirmacao).toContainText(/\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
});

test('formulário barra envio inválido antes de chamar a API', async ({
  page,
}) => {
  let chamouApi = false;
  page.on('request', (request) => {
    if (request.url().includes('/api/submissions')) chamouApi = true;
  });

  await page.goto('/manifestacao');
  await page.getByRole('button', { name: /enviar/i }).click();

  // O anunciador de rota do Next também usa role=alert; filtramos pelo resumo.
  await expect(
    page.getByRole('alert').filter({ hasText: /corrija/i }),
  ).toBeVisible();
  expect(chamouApi).toBe(false);
});
