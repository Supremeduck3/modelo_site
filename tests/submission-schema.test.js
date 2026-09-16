import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSubmissionInput } from '../src/lib/submissions/schema.js';

const valido = {
  type: 'complaint',
  title: 'Atendimento demorado na loja',
  description:
    'Aguardei mais de uma hora para ser atendido e ninguém informou a previsão.',
  contactEmail: 'pessoa@exemplo.com',
};

test('aceita uma manifestação completa', () => {
  const { success, data } = validateSubmissionInput(valido);
  assert.ok(success);
  assert.equal(data.type, 'complaint');
  assert.equal(data.contactEmail, 'pessoa@exemplo.com');
});

test('exige ao menos um meio de contato', () => {
  const { success, errors } = validateSubmissionInput({
    ...valido,
    contactEmail: '',
  });
  assert.equal(success, false);
  assert.match(errors.contactEmail, /e-mail ou um telefone/);
});

test('telefone sozinho é contato suficiente', () => {
  const { success } = validateSubmissionInput({
    ...valido,
    contactEmail: '',
    contactPhone: '(11) 90000-0000',
  });
  assert.ok(success);
});

test('rejeita tipo fora do domínio', () => {
  const { success, errors } = validateSubmissionInput({
    ...valido,
    type: 'reclamacao_livre',
  });
  assert.equal(success, false);
  assert.ok(errors.type);
});

test('exige assunto e descrição com conteúdo mínimo', () => {
  const { success, errors } = validateSubmissionInput({
    ...valido,
    title: 'oi',
    description: 'curto',
  });
  assert.equal(success, false);
  assert.ok(errors.title);
  assert.ok(errors.description);
});

test('espaços em branco não contam como conteúdo', () => {
  const { success, errors } = validateSubmissionInput({
    ...valido,
    title: '                    ',
  });
  assert.equal(success, false);
  assert.ok(errors.title);
});

test('campos opcionais vazios viram null, não string vazia', () => {
  const { data } = validateSubmissionInput({
    ...valido,
    contactName: '',
    contactPhone: '',
    categoryId: '',
  });
  assert.equal(data.contactName, null);
  assert.equal(data.contactPhone, null);
  assert.equal(data.categoryId, null);
});

test('limita o tamanho da descrição', () => {
  const { success, errors } = validateSubmissionInput({
    ...valido,
    description: 'a'.repeat(5001),
  });
  assert.equal(success, false);
  assert.ok(errors.description);
});
