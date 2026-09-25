import { expect, test } from '@playwright/test';
import { PAINEL_STORAGE_STATE } from './storage';

/**
 * Agendamento de ponta a ponta: o cliente pede pelo celular, a empresa
 * confirma no painel e o cliente vê a confirmação pelo link do pedido.
 *
 * O serviço usado é criado aqui, pela API do painel, e apagado no fim: o teste
 * não depende de a tabela de exemplo ter sido carregada no banco.
 */

const CELULAR = { width: 390, height: 844 };
const SERVICO = `Corte de teste ${Date.now()}`;
let servicoId;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  const contexto = await browser.newContext({
    storageState: PAINEL_STORAGE_STATE,
  });
  const resposta = await contexto.request.post('/api/painel/servicos', {
    data: {
      name: SERVICO,
      category: 'Teste',
      price: '45,00',
      durationMinutes: 30,
      bookable: true,
      isActive: true,
    },
  });
  expect(resposta.status()).toBe(201);
  servicoId = (await resposta.json()).offering.id;
  await contexto.close();
});

test.afterAll(async ({ browser }) => {
  if (!servicoId) return;
  const contexto = await browser.newContext({
    storageState: PAINEL_STORAGE_STATE,
  });
  await contexto.request.delete(`/api/painel/servicos/${servicoId}`);
  await contexto.close();
});

/** Próximo dia da semana `alvo` (0 = domingo) a partir de hoje, "AAAA-MM-DD". */
function proximo(alvo) {
  const data = new Date();
  data.setUTCHours(12, 0, 0, 0);
  do data.setUTCDate(data.getUTCDate() + 1);
  while (data.getUTCDay() !== alvo);
  return data.toISOString().slice(0, 10);
}

let codigo;

test('cliente pede horário pelo celular e recebe código', async ({
  browser,
}) => {
  // Rolagem suave ligada faria o clique cair no meio do deslize.
  const contexto = await browser.newContext({
    viewport: CELULAR,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const page = await contexto.newPage();
  await page.goto('/agendar');

  // Enviar vazio aponta o que falta e leva o foco ao primeiro campo.
  await page.getByRole('button', { name: 'Pedir horário' }).click();
  await expect(page.getByText('Escolha o serviço.')).toBeVisible();
  await expect(page.getByText('Informe seu nome.')).toBeVisible();

  await page.getByRole('radio', { name: new RegExp(SERVICO) }).check();
  await page.locator('input[name="date"]').first().check();
  await page.locator('input[name="period"]').first().check();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Cliente de Teste');
  await page.getByRole('textbox', { name: 'WhatsApp' }).fill('(11) 98765-4321');

  // O resumo repete a escolha antes do envio.
  await expect(page.getByText(SERVICO, { exact: true }).last()).toBeVisible();

  await page.getByRole('button', { name: 'Pedir horário' }).click();
  await expect(page.getByText('Pedido enviado!')).toBeVisible();

  codigo = (
    await page.getByText(/^\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/).textContent()
  ).trim();

  await page.getByRole('link', { name: 'Acompanhar pedido' }).click();
  await expect(page).toHaveURL(new RegExp(`/agendar/pedido/${codigo}$`));
  await expect(page.getByText('Aguardando confirmação')).toBeVisible();
  // A página pública não expõe o telefone de ninguém.
  await expect(page.getByText('98765-4321')).toHaveCount(0);

  await contexto.close();
});

test('empresa confirma no painel e o cliente vê o horário', async ({
  browser,
}) => {
  test.skip(!codigo, 'depende do pedido criado no teste anterior');

  const painel = await browser.newContext({
    viewport: CELULAR,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    storageState: PAINEL_STORAGE_STATE,
  });
  const page = await painel.newPage();
  await page.goto('/painel/agenda');
  await page
    .getByRole('link', { name: /Cliente de Teste/ })
    .filter({ hasText: SERVICO })
    .first()
    .click();
  await expect(page.getByText(codigo)).toBeVisible();

  await page.getByRole('button', { name: 'Confirmar horário' }).click();
  await page.getByLabel('Hora').fill('15:30');
  await page.getByLabel('Mensagem ao cliente').fill('Chegue 10 minutos antes.');
  await page
    .locator('form')
    .getByRole('button', { name: 'Confirmar horário' })
    .click();

  // Depois da decisão, o aviso pelo WhatsApp já vem escrito.
  const aviso = page.getByRole('link', { name: 'Avisar no WhatsApp' });
  await expect(aviso).toBeVisible();
  const href = decodeURIComponent(await aviso.getAttribute('href'));
  expect(href).toContain('https://wa.me/5511987654321');
  expect(href).toContain('confirmado');
  expect(href).toContain('15:30');
  await painel.close();

  const cliente = await browser.newPage();
  await cliente.goto(`/agendar/pedido/${codigo}`);
  await expect(cliente.getByText('Confirmado', { exact: true })).toBeVisible();
  await expect(cliente.getByText(/às 15:30/)).toBeVisible();
  await expect(cliente.getByText('Chegue 10 minutos antes.')).toBeVisible();
  await cliente.close();
});

test('servidor recusa dia fechado mesmo burlando o formulário', async ({
  request,
}) => {
  // A implantação de demonstração fecha aos domingos.
  const resposta = await request.post('/api/agendamentos', {
    data: {
      serviceId: servicoId,
      date: proximo(0),
      period: 'manha',
      customerName: 'Burlando',
      customerPhone: '11987654321',
    },
  });
  expect(resposta.status()).toBe(400);
  const corpo = await resposta.json();
  expect(corpo.error.details.date).toBeTruthy();
});

test('código inexistente não revela nada', async ({ page }) => {
  const resposta = await page.goto('/agendar/pedido/2026-AAAA-AAAA');
  expect(resposta.status()).toBe(404);
});
