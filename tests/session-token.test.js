import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from '../src/server/lib/session-token.js';

const SEGREDO = 'a'.repeat(48);
const OUTRO_SEGREDO = 'b'.repeat(48);

const SESSAO = {
  userId: 'user-1',
  companyId: 'company-1',
  role: 'owner',
  name: 'Ana',
};

/** Roda `fn` com AUTH_SECRET definido, restaurando o valor anterior depois. */
function comSegredo(secret, fn) {
  const anterior = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = secret;
  try {
    return fn();
  } finally {
    if (anterior === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = anterior;
  }
}

test('token válido devolve a sessão', () => {
  comSegredo(SEGREDO, () => {
    const token = createSessionToken(SESSAO);
    const sessao = verifySessionToken(token);

    assert.equal(sessao.userId, 'user-1');
    assert.equal(sessao.companyId, 'company-1');
    assert.equal(sessao.role, 'owner');
    assert.equal(sessao.name, 'Ana');
    assert.ok(sessao.expiresAt instanceof Date);
  });
});

test('payload adulterado não valida', () => {
  comSegredo(SEGREDO, () => {
    const token = createSessionToken(SESSAO);
    const [encoded, signature] = token.split('.');

    // Troca o usuário mantendo a assinatura original: é a tentativa óbvia de
    // virar outra pessoa.
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    payload.sub = 'user-2';
    const forjado = Buffer.from(JSON.stringify(payload)).toString('base64url');

    assert.equal(verifySessionToken(`${forjado}.${signature}`), null);
  });
});

test('assinatura adulterada ou ausente não valida', () => {
  comSegredo(SEGREDO, () => {
    const token = createSessionToken(SESSAO);
    const [encoded] = token.split('.');

    assert.equal(verifySessionToken(`${encoded}.AAAA`), null);
    assert.equal(verifySessionToken(encoded), null);
    assert.equal(verifySessionToken(`${encoded}.`), null);
    assert.equal(verifySessionToken(`${encoded}.a.b`), null);
  });
});

test('token de outro segredo não valida', () => {
  const token = comSegredo(SEGREDO, () => createSessionToken(SESSAO));

  // Trocar AUTH_SECRET precisa derrubar as sessões abertas.
  comSegredo(OUTRO_SEGREDO, () => {
    assert.equal(verifySessionToken(token), null);
  });
});

test('token expirado não valida', () => {
  comSegredo(SEGREDO, () => {
    const agora = Date.now();
    const token = createSessionToken(SESSAO, { ttlSeconds: 60, now: agora });

    assert.ok(verifySessionToken(token, { now: agora + 59_000 }));
    assert.equal(verifySessionToken(token, { now: agora + 61_000 }), null);
  });
});

test('a validade padrão é a declarada', () => {
  comSegredo(SEGREDO, () => {
    const agora = Date.now();
    const token = createSessionToken(SESSAO, { now: agora });
    const sessao = verifySessionToken(token, { now: agora });

    // `iat` é em segundos inteiros, então a validade cai até 1s abaixo do TTL.
    const segundos = (sessao.expiresAt.getTime() - agora) / 1000;
    assert.ok(segundos > SESSION_TTL_SECONDS - 1);
    assert.ok(segundos <= SESSION_TTL_SECONDS);
  });
});

test('entrada que não é token não valida', () => {
  comSegredo(SEGREDO, () => {
    for (const invalido of ['', 'abc', '.', null, undefined, 42, {}]) {
      assert.equal(verifySessionToken(invalido), null);
    }
  });
});

test('segredo ausente ou curto derruba com erro explícito', () => {
  const anterior = process.env.AUTH_SECRET;
  try {
    delete process.env.AUTH_SECRET;
    assert.throws(() => createSessionToken(SESSAO), /AUTH_SECRET/);

    process.env.AUTH_SECRET = 'curto';
    assert.throws(() => createSessionToken(SESSAO), /AUTH_SECRET/);
  } finally {
    if (anterior === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = anterior;
  }
});

test('sessão sem usuário ou sem empresa não é emitida', () => {
  comSegredo(SEGREDO, () => {
    assert.throws(() => createSessionToken({ companyId: 'c' }));
    assert.throws(() => createSessionToken({ userId: 'u' }));
  });
});
