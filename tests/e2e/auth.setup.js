import { expect, test as setup } from '@playwright/test';
import { PAINEL_STORAGE_STATE } from './storage';

/**
 * Autentica uma vez e guarda a sessão para os testes que só precisam estar
 * logados.
 *
 * Existe por causa de uma proteção real do produto: o login limita tentativas
 * por e-mail (5 a cada 10 minutos). Com cada arquivo de teste fazendo o seu
 * login, a suíte inteira estourava a cota e falhava por 429 — o teste é que
 * estava errado, não o limite. Os testes do próprio fluxo de login continuam
 * entrando de verdade, e são poucos.
 *
 * Consequência a conhecer: rodar a suíte muitas vezes em poucos minutos ainda
 * esgota a cota, porque cada execução faz um login aqui e os do fluxo de login
 * fazem os seus. Se o setup falhar com 429, espere a janela de 10 minutos —
 * não é regressão, é o limite fazendo o que deve.
 */
const EMAIL = process.env.E2E_PANEL_EMAIL ?? process.env.SEED_ADMIN_EMAIL;
const PASSWORD =
  process.env.E2E_PANEL_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;

setup('autentica no painel', async ({ page }) => {
  setup.skip(
    !EMAIL || !PASSWORD,
    'Defina E2E_PANEL_EMAIL e E2E_PANEL_PASSWORD para os testes autenticados.',
  );

  await page.goto('/painel/login');
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/painel$/);
  await page.context().storageState({ path: PAINEL_STORAGE_STATE });
});
