import { expect, test } from '@playwright/test';
import { PAINEL_STORAGE_STATE } from './storage';

/**
 * Fluxo da equipe: quem administra convida, e o convite é a única porta de
 * entrada — não existe senha provisória a ser repassada.
 */
const EMAIL = process.env.E2E_PANEL_EMAIL ?? process.env.SEED_ADMIN_EMAIL;
const PASSWORD =
  process.env.E2E_PANEL_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;

test('equipe exige sessão', async ({ page }) => {
  await page.goto('/painel/equipe');
  await expect(page).toHaveURL(/\/painel\/login\?next=/);
});

/*
 * A recusa é procurada pelo texto, não por `getByRole('alert')` sozinho: o
 * App Router injeta, depois da hidratação, um anunciador de rota com região
 * viva assertiva, que também conta como alerta. Filtrar pelo texto olha o
 * aviso que interessa ao visitante em vez de contar elementos.
 */
const RECUSA = /Este convite não é mais válido/;

test('convite sem token mostra recusa, sem pedir senha', async ({ page }) => {
  await page.goto('/painel/convite');

  // A tela é pública: precisa recusar sem expor formulário nenhum.
  await expect(
    page.getByRole('alert').filter({ hasText: RECUSA }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test('convite com token inventado é recusado igual', async ({ page }) => {
  await page.goto('/painel/convite?token=token-que-nunca-existiu');

  await expect(
    page.getByRole('alert').filter({ hasText: RECUSA }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test.describe('com credencial válida', () => {
  test.skip(
    !EMAIL || !PASSWORD,
    'defina E2E_PANEL_EMAIL e E2E_PANEL_PASSWORD para rodar',
  );

  // Sessão do projeto de setup: evita estourar a cota de tentativas de login,
  // que é uma proteção real e não deve ser afrouxada por causa dos testes.
  test.use({ storageState: PAINEL_STORAGE_STATE });

  test('responsável convida e recebe o link uma vez', async ({ page }) => {
    await page.goto('/painel/equipe');

    const email = `convidado-${Date.now()}@exemplo.invalid`;
    await page.getByLabel('Nome').fill('Pessoa Convidada');
    await page.getByLabel('E-mail').fill(email);
    // `exact`: "Reenviar convite" das linhas pendentes contém este texto.
    await page
      .getByRole('button', { name: 'Enviar convite', exact: true })
      .click();

    // O link precisa aparecer na tela: é o caminho de quem não tem SMTP.
    // Ele vem num campo somente-leitura dentro do modal — os selects do antd
    // também usam input readonly, por isso o escopo no diálogo.
    const campoLink = page.getByRole('dialog').locator('input[readonly]');
    await expect(campoLink).toHaveValue(/\/painel\/convite\?token=/);

    // E a pessoa entra na lista como convite pendente, não como ativa.
    await expect(page.getByText(email)).toBeVisible();
  });

  test('a própria linha não oferece ação sobre si mesmo', async ({ page }) => {
    await page.goto('/painel/equipe');

    const minhaLinha = page.getByRole('row').filter({ hasText: '(você)' });
    await expect(minhaLinha).toHaveCount(1);
    await expect(minhaLinha.getByRole('button')).toHaveCount(0);
  });
});
