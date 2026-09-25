import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APPOINTMENT_ACTIONS,
  APPOINTMENT_STATUSES,
  actionsFor,
} from '../src/lib/booking/constants.js';
import {
  addDays,
  bookableDates,
  dateParts,
  formatDateLong,
  isBookableDate,
  isValidDate,
  isValidTime,
  todayIn,
  toYmd,
} from '../src/lib/booking/dates.js';
import { validateAppointmentAction } from '../src/lib/booking/management-schema.js';
import {
  customerMessage,
  customerSubject,
} from '../src/lib/booking/messages.js';
import { validateAppointmentRequest } from '../src/lib/booking/schema.js';

const SP = 'America/Sao_Paulo';

/* ───────── datas ───────── */

test('"hoje" é o dia no fuso da empresa, não em UTC', () => {
  // Domingo 23h30 em São Paulo já é segunda em UTC.
  const now = new Date('2026-09-28T02:30:00Z');
  assert.equal(todayIn(SP, now), '2026-09-27');
  assert.equal(todayIn('UTC', now), '2026-09-28');
});

test('dias pedíveis começam hoje, respeitam a janela e pulam dia fechado', () => {
  const now = new Date('2026-09-28T02:30:00Z'); // domingo, 27, em SP
  const dias = bookableDates(
    { timezone: SP, daysAhead: 8, closedWeekdays: [0] },
    now,
  );

  // 27/09 e 04/10 são domingo: ficam de fora. A janela é 27/09..04/10.
  assert.deepEqual(dias, [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
  ]);
});

test('dia fora da janela, fechado ou inexistente não é pedível', () => {
  const now = new Date('2026-09-29T12:00:00Z'); // terça
  const regras = { timezone: SP, daysAhead: 7, closedWeekdays: [0] };

  assert.equal(isBookableDate('2026-09-29', regras, now), true);
  assert.equal(isBookableDate('2026-09-28', regras, now), false, 'ontem');
  assert.equal(isBookableDate('2026-10-04', regras, now), false, 'domingo');
  assert.equal(isBookableDate('2026-10-06', regras, now), false, 'fora');
  assert.equal(isBookableDate('2026-02-30', regras, now), false);
});

test('conta de dias atravessa mês e ano sem deslocar por fuso', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  // Mudança de horário de verão de outros fusos não mexe no texto do dia.
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
});

test('validação de dia e hora', () => {
  assert.ok(isValidDate('2028-02-29'));
  assert.ok(!isValidDate('2026-02-29'));
  assert.ok(!isValidDate('29/09/2026'));
  assert.ok(isValidTime('00:00'));
  assert.ok(isValidTime('23:59'));
  assert.ok(!isValidTime('24:00'));
  assert.ok(!isValidTime('9:30'));
});

test('formatação em português, sem deslocar o dia', () => {
  assert.deepEqual(dateParts('2026-09-29'), {
    semana: 'ter',
    dia: '29',
    mes: 'set',
  });
  assert.equal(formatDateLong('2026-09-29'), 'terça-feira, 29 de setembro');
  assert.equal(toYmd(new Date('2026-09-29T00:00:00Z')), '2026-09-29');
  assert.equal(toYmd(null), null);
});

/* ───────── pedido público ───────── */

const pedido = {
  serviceId: 'abc',
  date: '2026-09-29',
  period: 'tarde',
  customerName: '  Ana Souza ',
  customerPhone: '(11) 98765-4321',
  customerEmail: '',
  notes: '',
};

test('pedido válido guarda só dígitos do telefone e vazio como null', () => {
  const { success, data } = validateAppointmentRequest(pedido);
  assert.ok(success);
  assert.equal(data.customerName, 'Ana Souza');
  assert.equal(data.customerPhone, '11987654321');
  assert.equal(data.customerEmail, null);
  assert.equal(data.notes, null);
  assert.equal(data.professional, null);
});

test('pedido recusa telefone sem DDD, período inventado e dia inválido', () => {
  const { success, errors } = validateAppointmentRequest({
    ...pedido,
    customerPhone: '98765-4321',
    period: 'madrugada',
    date: '2026-02-30',
  });
  assert.ok(!success);
  assert.ok(errors.customerPhone);
  assert.ok(errors.period);
  assert.ok(errors.date);
});

test('pedido sem serviço nem nome aponta os dois campos', () => {
  const { errors } = validateAppointmentRequest({
    ...pedido,
    serviceId: '',
    customerName: 'A',
  });
  assert.equal(errors.serviceId, 'Escolha o serviço.');
  assert.equal(errors.customerName, 'Informe seu nome.');
});

/* ───────── ações do painel ───────── */

test('confirmar e propor exigem dia e hora; recusar não', () => {
  assert.ok(!validateAppointmentAction({ action: 'confirm' }).success);
  assert.ok(
    validateAppointmentAction({
      action: 'confirm',
      date: '2026-09-29',
      time: '14:30',
    }).success,
  );
  const semHora = validateAppointmentAction({
    action: 'propose',
    date: '2026-09-29',
    time: '',
  });
  assert.equal(semHora.errors.time, 'Informe o horário (ex.: 14:30).');
  assert.ok(validateAppointmentAction({ action: 'decline' }).success);
  assert.ok(!validateAppointmentAction({ action: 'apagar' }).success);
});

test('estados encerrados não têm ação — o histórico não é reescrito', () => {
  for (const status of ['declined', 'cancelled', 'completed', 'no_show']) {
    assert.deepEqual(actionsFor(status), [], status);
  }
  assert.deepEqual(actionsFor('pending'), ['confirm', 'propose', 'decline']);
  assert.ok(actionsFor('confirmed').includes('complete'));
});

test('toda ação leva a um status que existe', () => {
  const status = APPOINTMENT_STATUSES.map((s) => s.value);
  for (const [nome, acao] of Object.entries(APPOINTMENT_ACTIONS)) {
    assert.ok(status.includes(acao.to), `${nome} → ${acao.to}`);
    for (const origem of acao.from) assert.ok(status.includes(origem));
  }
});

/* ───────── mensagens ao cliente ───────── */

const agendamento = {
  customerName: 'Ana Souza',
  serviceName: 'Corte feminino',
  requestedDate: '2026-09-29',
  requestedPeriod: 'tarde',
  scheduledDate: '2026-09-30',
  scheduledTime: '15:30',
  responseMessage: 'Chegue 10 minutos antes.',
};

test('confirmação traz serviço, dia, hora, recado e assinatura', () => {
  const texto = customerMessage({
    appointment: agendamento,
    status: 'confirmed',
    companyName: 'Salão Bela',
    trackingUrl: 'https://salao.test/agendar/pedido/X',
  });
  assert.match(texto, /^Olá, Ana!/);
  assert.match(texto, /Corte feminino/);
  assert.match(texto, /quarta-feira, 30 de setembro \(30\/09\), às 15:30/);
  assert.match(texto, /Chegue 10 minutos antes\./);
  assert.match(texto, /https:\/\/salao\.test\/agendar\/pedido\/X/);
  assert.match(texto, /Salão Bela$/);
});

test('proposta cita o que o cliente pediu e o horário novo', () => {
  const texto = customerMessage({
    appointment: agendamento,
    status: 'proposed',
    companyName: 'Salão Bela',
  });
  assert.match(texto, /terça-feira, 29 de setembro, tarde/);
  assert.match(texto, /quarta-feira, 30 de setembro/);
});

test('atendido e não compareceu não geram aviso', () => {
  for (const status of ['completed', 'no_show', 'pending']) {
    assert.equal(
      customerMessage({
        appointment: agendamento,
        status,
        companyName: 'X',
      }),
      null,
    );
    assert.equal(customerSubject({ status, companyName: 'X' }), null);
  }
});
