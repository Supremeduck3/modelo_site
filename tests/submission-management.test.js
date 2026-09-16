import assert from 'node:assert/strict';
import test from 'node:test';
import {
  can,
  PERMISSIONS,
  permissionsOf,
} from '../src/lib/auth/permissions.js';
import {
  PAGE_SIZE,
  validateClassification,
  validateInternalNote,
  validatePublicResponse,
  validateSubmissionFilters,
} from '../src/lib/submissions/management-schema.js';

test('filtros vazios caem em página 1 e tamanho padrão', () => {
  const { data } = validateSubmissionFilters({});
  assert.equal(data.page, 1);
  assert.equal(data.pageSize, PAGE_SIZE);
  assert.equal(data.archived, false);
  assert.equal(data.status, undefined);
});

test('filtro desconhecido na URL é descartado, não quebra a lista', () => {
  const { success, data } = validateSubmissionFilters({
    status: 'inventado',
    type: '',
    page: 'abc',
  });
  assert.equal(success, true);
  assert.equal(data.status, undefined);
  assert.equal(data.page, 1);
});

test('tamanho de página tem teto, para a URL não pedir a base inteira', () => {
  const { data } = validateSubmissionFilters({ pageSize: '100000' });
  assert.ok(data.pageSize <= 100);
});

test('página negativa volta para a primeira', () => {
  const { data } = validateSubmissionFilters({ page: '-3' });
  assert.equal(data.page, 1);
});

test('"nobody" é um filtro válido de sem responsável', () => {
  const { data } = validateSubmissionFilters({ assignedTo: 'nobody' });
  assert.equal(data.assignedTo, 'nobody');
});

test('classificação exige ao menos um campo', () => {
  const { success } = validateClassification({});
  assert.equal(success, false);
});

test('classificação distingue "remover" de "não mexer"', () => {
  const remove = validateClassification({ categoryId: '' });
  assert.equal(remove.success, true);
  assert.equal(remove.data.categoryId, null);

  const intacto = validateClassification({ status: 'resolved' });
  assert.equal(intacto.success, true);
  assert.equal(
    'categoryId' in intacto.data,
    false,
    'campo ausente não pode virar null e apagar a categoria',
  );
});

test('classificação recusa situação e prioridade fora do domínio', () => {
  assert.equal(validateClassification({ status: 'arquivada' }).success, false);
  assert.equal(
    validateClassification({ priority: 'altissima' }).success,
    false,
  );
});

test('nota interna exige conteúdo e tem teto', () => {
  assert.equal(validateInternalNote({ note: ' ' }).success, false);
  assert.equal(validateInternalNote({ note: 'a'.repeat(5001) }).success, false);
  assert.equal(validateInternalNote({ note: 'Cliente ligou.' }).success, true);
});

test('resposta pública exige texto com substância', () => {
  const curta = validatePublicResponse({ response: 'ok' });
  assert.equal(curta.success, false);
  assert.ok(curta.errors.response);

  const boa = validatePublicResponse({
    response: 'Sua solicitação foi atendida nesta semana.',
    status: 'resolved',
  });
  assert.equal(boa.success, true);
  assert.equal(boa.data.status, 'resolved');
});

test('resposta pública recusa situação inventada', () => {
  const { success } = validatePublicResponse({
    response: 'Texto suficientemente longo para passar.',
    status: 'respondida',
  });
  assert.equal(success, false);
});

test('operador opera manifestações mas não mexe em configurações', () => {
  const operador = { role: 'operator' };
  assert.ok(can(operador, PERMISSIONS.SUBMISSIONS_VIEW));
  assert.ok(can(operador, PERMISSIONS.SUBMISSIONS_MANAGE));
  assert.equal(can(operador, PERMISSIONS.SETTINGS_MANAGE), false);
  assert.equal(can(operador, PERMISSIONS.SUBMISSIONS_ARCHIVE), false);
});

test('responsável e administrador têm acesso integral', () => {
  for (const role of ['owner', 'admin']) {
    for (const permission of Object.values(PERMISSIONS)) {
      assert.ok(can({ role }, permission), `${role} deveria ter ${permission}`);
    }
  }
});

test('papel desconhecido ou ausente não recebe permissão', () => {
  assert.deepEqual(permissionsOf('visitante'), []);
  assert.equal(can({ role: 'visitante' }, PERMISSIONS.SUBMISSIONS_VIEW), false);
  assert.equal(can(null, PERMISSIONS.SUBMISSIONS_VIEW), false);
  assert.equal(can({}, PERMISSIONS.SUBMISSIONS_VIEW), false);
});

test('resposta ao visitante não carrega nota interna nem dado de operação', async () => {
  const { submissionAnsweredForVisitor } = await import(
    '../src/server/modules/mail/messages.js'
  );

  const { subject, text, html } = submissionAnsweredForVisitor({
    submission: {
      protocol: '2026-A7K2-9QX4',
      title: 'Cobrança divergente',
      type: 'complaint',
      contactName: 'Joana',
      contactEmail: 'joana@exemplo.com',
      // Campos de operação que existem no registro e NÃO podem sair:
      status: 'resolved',
      priority: 'urgent',
      assignee: { name: 'Ana Responsável' },
    },
    companyName: 'Demo Serviços',
    typeLabel: 'Reclamação',
    response: 'Conferimos e o valor foi ajustado.',
  });

  const corpo = `${subject}\n${text}\n${html}`;
  assert.ok(corpo.includes('Conferimos e o valor foi ajustado.'));
  assert.ok(corpo.includes('2026-A7K2-9QX4'));

  for (const vazamento of ['urgent', 'Urgente', 'Ana Responsável']) {
    assert.ok(
      !corpo.includes(vazamento),
      `"${vazamento}" não pode aparecer no e-mail ao visitante`,
    );
  }
});

test('texto da equipe é escapado antes de virar HTML no e-mail', async () => {
  const { submissionAnsweredForVisitor } = await import(
    '../src/server/modules/mail/messages.js'
  );

  const { html } = submissionAnsweredForVisitor({
    submission: { protocol: 'P', title: 'T', type: 'complaint' },
    companyName: 'Demo',
    typeLabel: 'Reclamação',
    response: '<script>alert(1)</script>',
  });

  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
