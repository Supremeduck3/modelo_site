import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSiteConfig } from '../src/config/site/schema.js';
import { can, PERMISSIONS } from '../src/lib/auth/permissions.js';
import { appointmentRequestedForTeam } from '../src/server/modules/mail/messages.js';

const base = { identity: { name: 'Salão' } };

test('agendamento e tabela de preços vêm desligados por padrão', () => {
  const { config } = validateSiteConfig(base);
  assert.equal(config.features.booking, false);
  assert.equal(config.features.pricing, false);
  assert.equal(config.contact.whatsappButton.enabled, false);
});

test('configuração ruim de agendamento vira aviso e cai no padrão', () => {
  const { config, warnings, errors } = validateSiteConfig({
    ...base,
    booking: {
      timezone: 'Marte/Olympus',
      daysAhead: 500,
      closedWeekdays: [0, 9, 6, 6, 'x'],
      periods: ['noite', 'madrugada', 'manha'],
      professionals: ['  Joana ', '', 3],
    },
  });

  assert.deepEqual(errors, []);
  assert.equal(config.booking.timezone, 'America/Sao_Paulo');
  assert.equal(config.booking.daysAhead, 21);
  assert.deepEqual(config.booking.closedWeekdays, [0, 6]);
  // Na ordem do dia, não na ordem digitada.
  assert.deepEqual(config.booking.periods, ['manha', 'noite']);
  assert.deepEqual(config.booking.professionals, ['Joana']);
  assert.ok(warnings.some((w) => w.includes('timezone')));
  assert.ok(warnings.some((w) => w.includes('daysAhead')));
});

test('fechar todos os dias não pode deixar o formulário sem dia nenhum', () => {
  const { config, warnings } = validateSiteConfig({
    ...base,
    booking: { closedWeekdays: [0, 1, 2, 3, 4, 5, 6] },
  });
  assert.deepEqual(config.booking.closedWeekdays, [0]);
  assert.ok(warnings.some((w) => w.includes('todos os dias')));
});

test('operador cuida da agenda, mas não mexe em preço', () => {
  const operador = { role: 'operator' };
  assert.ok(can(operador, PERMISSIONS.APPOINTMENTS_VIEW));
  assert.ok(can(operador, PERMISSIONS.APPOINTMENTS_MANAGE));
  assert.ok(!can(operador, PERMISSIONS.CATALOG_MANAGE));
  assert.ok(can({ role: 'admin' }, PERMISSIONS.CATALOG_MANAGE));
});

test('aviso à equipe escapa o que o cliente escreveu', () => {
  const { html, text, replyTo } = appointmentRequestedForTeam({
    appointment: {
      code: '2026-AAAA-BBBB',
      serviceName: 'Corte',
      customerName: '<script>alert(1)</script>',
      customerEmail: 'ana@exemplo.com',
      notes: '<img src=x onerror=alert(1)>',
    },
    companyName: 'Salão',
    when: 'terça-feira, 29 de setembro, tarde',
    phone: '(11) 98765-4321',
    panelUrl: 'https://salao.test/painel/agenda',
  });

  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));
  // No texto puro não há o que escapar: é texto.
  assert.ok(text.includes('<script>'));
  assert.ok(text.includes('(11) 98765-4321'));
  assert.equal(replyTo, 'ana@exemplo.com');
});

/* ───────── exemplo de salão ───────── */

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

test('exemplo de salão é uma configuração válida, sem aviso', async () => {
  const { default: salao } = await import(
    '../src/config/site/exemplos/salao.config.js'
  );
  const { config, errors, warnings } = validateSiteConfig(salao);

  // O exemplo é para copiar: não pode chegar com erro nem aviso.
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(config.features.booking, true);
  assert.equal(config.features.pricing, true);
  assert.ok(config.pages.home.sections.some((s) => s.type === 'pricing'));
});

test('cores do exemplo de salão têm contraste de texto', async () => {
  const { default: salao } = await import(
    '../src/config/site/exemplos/salao.config.js'
  );
  const c = salao.theme.colors;

  for (const [frente, fundo] of [
    ['text', 'background'],
    ['text', 'surface'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['primaryContrast', 'primary'],
    // Cor da marca vira texto em link e em título de grupo.
    ['primary', 'background'],
  ]) {
    const razao = contraste(c[frente], c[fundo]);
    assert.ok(
      razao >= 4.5,
      `${frente} sobre ${fundo} dá ${razao.toFixed(2)}:1, mínimo 4,5:1`,
    );
  }
});
