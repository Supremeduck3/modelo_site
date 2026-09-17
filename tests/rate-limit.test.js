import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeGlobalRateLimit,
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

test('teto global conta a rota inteira, sem olhar quem chama', () => {
  resetRateLimit();
  const opcoes = { limit: 3, windowMs: 60_000 };

  for (let i = 0; i < 3; i += 1) {
    assert.ok(consumeGlobalRateLimit('login', opcoes).allowed);
  }

  assert.equal(consumeGlobalRateLimit('login', opcoes).allowed, false);
  // Outra rota tem teto próprio.
  assert.ok(consumeGlobalRateLimit('submissions', opcoes).allowed);
});

test('inundação com identificador falsificado não apaga o teto global', () => {
  resetRateLimit();
  const global = { limit: 10, windowMs: 60_000 };

  /*
   * A chave do teto global vive no mesmo mapa das cotas por cliente, e o mapa
   * despeja as chaves mais antigas quando passa de 5000. Como o teto é criado
   * no começo da janela, ele está entre as primeiras — era despejado, e o
   * contador renascia em 1.
   *
   * Cada despejo devolve uma janela inteira de cota a quem está inundando, que
   * é justamente quem o teto deveria conter. Contar as liberações mede isso
   * sem depender de quantos despejos acontecem: passada a décima, nenhuma
   * outra pode ser liberada dentro da janela.
   */
  let liberadas = 0;
  for (let i = 0; i < 12_000; i += 1) {
    consumeRateLimit(`submissions:ip-falso-${i}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (consumeGlobalRateLimit('submissions', global).allowed) liberadas += 1;
  }

  assert.equal(
    liberadas,
    10,
    `o teto global liberou ${liberadas} requisições numa janela de 10 — a chave foi despejada e o contador reiniciou`,
  );
});
