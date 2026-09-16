import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashPassword,
  PASSWORD_RULES,
  PasswordPolicyError,
  verifyPassword,
} from '../src/server/lib/password.js';

const SENHA = 'senha-bem-comprida-2026';

test('aceita a senha correta e recusa a errada', async () => {
  const hash = await hashPassword(SENHA);

  assert.equal(await verifyPassword(SENHA, hash), true);
  assert.equal(await verifyPassword(`${SENHA}x`, hash), false);
  assert.equal(await verifyPassword('', hash), false);
});

test('duas senhas iguais geram hashes diferentes', async () => {
  const [a, b] = await Promise.all([hashPassword(SENHA), hashPassword(SENHA)]);

  // Sem salt por senha, hashes iguais revelariam quem usa a mesma senha.
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(SENHA, a), true);
  assert.equal(await verifyPassword(SENHA, b), true);
});

test('o hash carrega o algoritmo e o custo usados', async () => {
  const hash = await hashPassword(SENHA);
  const [algorithm, N, r, p, salt, digest] = hash.split('$');

  assert.equal(algorithm, 'scrypt');
  assert.equal(Number.isInteger(Number(N)), true);
  assert.equal(Number.isInteger(Number(r)), true);
  assert.equal(Number.isInteger(Number(p)), true);
  assert.ok(salt.length > 0);
  assert.ok(digest.length > 0);
});

test('hash adulterado não valida', async () => {
  const hash = await hashPassword(SENHA);
  const parts = hash.split('$');

  // Digest trocado.
  const outroDigest = [...parts.slice(0, 5), 'AAAA'].join('$');
  assert.equal(await verifyPassword(SENHA, outroDigest), false);

  // Salt trocado.
  const outroSalt = [...parts.slice(0, 4), 'AAAA', parts[5]].join('$');
  assert.equal(await verifyPassword(SENHA, outroSalt), false);
});

test('formato de hash desconhecido não valida', async () => {
  for (const invalido of [
    '',
    'texto-puro',
    'bcrypt$32768$8$1$c2FsdA$aGFzaA',
    'scrypt$x$8$1$c2FsdA$aGFzaA',
    'scrypt$32768$8$1$c2FsdA',
    null,
    undefined,
    42,
  ]) {
    assert.equal(await verifyPassword(SENHA, invalido), false);
  }
});

test('política de senha vale na criação, não no login', async () => {
  const curta = 'a'.repeat(PASSWORD_RULES.minLength - 1);
  await assert.rejects(() => hashPassword(curta), PasswordPolicyError);

  const longa = 'a'.repeat(PASSWORD_RULES.maxLength + 1);
  await assert.rejects(() => hashPassword(longa), PasswordPolicyError);

  // Senha longa demais é recusada sem ir ao scrypt, não aceita por engano.
  const hash = await hashPassword(SENHA);
  assert.equal(await verifyPassword(longa, hash), false);
});

test('senha com acento valida independente da forma unicode', async () => {
  // A mesma senha digitada em teclado diferente pode chegar decomposta; sem
  // normalizar, o usuário seria barrado com a senha certa.
  const composta = 'senha-com-ação-2026'.normalize('NFC');
  const decomposta = composta.normalize('NFD');

  assert.notEqual(composta, decomposta);

  const hash = await hashPassword(composta);
  assert.equal(await verifyPassword(decomposta, hash), true);
});
