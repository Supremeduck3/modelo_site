import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateProtocol,
  isValidProtocol,
  normalizeProtocol,
} from '../src/lib/submissions/protocol.js';

test('protocolo segue o formato público AAAA-XXXX-XXXX', () => {
  const protocol = generateProtocol(new Date('2026-03-04T10:00:00Z'));
  assert.match(protocol, /^2026-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.ok(isValidProtocol(protocol));
});

test('protocolo não usa caracteres ambíguos nos blocos aleatórios', () => {
  // O ano é parte legítima do protocolo; a restrição vale para os blocos
  // sorteados, que são o que alguém dita por telefone.
  const blocos = Array.from({ length: 300 }, () =>
    generateProtocol().split('-').slice(1).join(''),
  ).join('');

  for (const char of ['0', 'O', '1', 'I', 'S', 'B', 'Z']) {
    assert.ok(
      !blocos.includes(char),
      `caractere ambíguo "${char}" apareceu no protocolo`,
    );
  }
});

test('protocolo não é previsível por sequência simples', () => {
  const total = 2000;
  const protocolos = new Set(
    Array.from({ length: total }, () => generateProtocol()),
  );
  // Com 28^8 combinações, colisão em 2000 sorteios seria sinal de sequência.
  assert.equal(protocolos.size, total);
});

test('isValidProtocol rejeita formatos inválidos', () => {
  for (const invalido of [
    '',
    '2026',
    '2026-ABCD',
    '2026-ABCD-EFG',
    'abc',
    null,
  ]) {
    assert.equal(isValidProtocol(invalido), false, String(invalido));
  }
});

test('normalizeProtocol limpa o que o visitante digitou', () => {
  assert.equal(normalizeProtocol('  2026-acde-fghj '), '2026-ACDE-FGHJ');
});
