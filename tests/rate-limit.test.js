import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeRateLimit,
  resetRateLimit,
} from '../src/server/lib/rate-limit.js';

test('libera até o limite e bloqueia o excedente', () => {
  resetRateLimit();
  const opcoes = { limit: 3, windowMs: 60_000 };

  for (let i = 0; i < 3; i += 1) {
    assert.ok(consumeRateLimit('ip-a', opcoes).allowed, `tentativa ${i + 1}`);
  }

  const bloqueado = consumeRateLimit('ip-a', opcoes);
  assert.equal(bloqueado.allowed, false);
  assert.ok(bloqueado.retryAfterSeconds > 0);
});

test('cotas são independentes por cliente', () => {
  resetRateLimit();
  const opcoes = { limit: 1, windowMs: 60_000 };

  assert.ok(consumeRateLimit('ip-a', opcoes).allowed);
  assert.equal(consumeRateLimit('ip-a', opcoes).allowed, false);
  assert.ok(consumeRateLimit('ip-b', opcoes).allowed);
});

test('a janela expira e a cota volta', async () => {
  resetRateLimit();
  const opcoes = { limit: 1, windowMs: 30 };

  assert.ok(consumeRateLimit('ip-c', opcoes).allowed);
  assert.equal(consumeRateLimit('ip-c', opcoes).allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 45));
  assert.ok(consumeRateLimit('ip-c', opcoes).allowed);
});
