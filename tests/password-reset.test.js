import assert from 'node:assert/strict';
import test from 'node:test';
import { PASSWORD_MIN_LENGTH } from '../src/lib/auth/password-rules.js';
import {
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from '../src/lib/auth/schema.js';
import {
  generateResetToken,
  hashResetToken,
  resetTokensMatch,
} from '../src/server/lib/reset-token.js';
import { passwordResetRequested } from '../src/server/modules/mail/messages.js';

test('pedido aceita e-mail e normaliza caixa e espaços', () => {
  const { success, data } = validateForgotPasswordInput({
    email: '  Ana@Demo.Example  ',
  });
  assert.ok(success);
  assert.equal(data.email, 'ana@demo.example');
});

test('pedido recusa e-mail malformado', () => {
  const { success, errors } = validateForgotPasswordInput({ email: 'ana@' });
  assert.equal(success, false);
  assert.ok(errors.email);
});

test('nova senha precisa atingir o tamanho mínimo da política', () => {
  const curta = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
  const { success, errors } = validateResetPasswordInput({
    token: 'token-qualquer',
    password: curta,
    passwordConfirmation: curta,
  });
  assert.equal(success, false);
  assert.match(errors.password, new RegExp(String(PASSWORD_MIN_LENGTH)));
});

test('confirmação diferente barra a redefinição', () => {
  const { success, errors } = validateResetPasswordInput({
    token: 'token-qualquer',
    password: 'senha-bem-comprida',
    passwordConfirmation: 'senha-bem-compridb',
  });
  assert.equal(success, false);
  assert.match(errors.passwordConfirmation, /não coincidem/i);
});

test('token vazio é recusado antes de chegar ao servidor', () => {
  const { success, errors } = validateResetPasswordInput({
    token: '   ',
    password: 'senha-bem-comprida',
    passwordConfirmation: 'senha-bem-comprida',
  });
  assert.equal(success, false);
  assert.ok(errors.token);
});

test('token de recuperação é aleatório e seguro para URL', () => {
  const tokens = new Set(Array.from({ length: 500 }, generateResetToken));
  assert.equal(tokens.size, 500);

  for (const token of tokens) {
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.equal(token, encodeURIComponent(token));
  }
});

test('o hash não permite recuperar o token', () => {
  const token = generateResetToken();
  const hash = hashResetToken(token);

  assert.notEqual(hash, token);
  assert.ok(!hash.includes(token));
  assert.equal(hash, hashResetToken(token), 'o hash precisa ser estável');
  assert.notEqual(hash, hashResetToken(generateResetToken()));
});

test('comparação de hashes rejeita valores diferentes e lixo', () => {
  const hash = hashResetToken('abc');
  assert.ok(resetTokensMatch(hash, hashResetToken('abc')));
  assert.equal(resetTokensMatch(hash, hashResetToken('abd')), false);
  assert.equal(resetTokensMatch(hash, ''), false);
  assert.equal(resetTokensMatch('', ''), false);
  assert.equal(resetTokensMatch(hash, null), false);
});

test('e-mail de recuperação leva o link e o prazo, em texto e HTML', () => {
  const resetUrl =
    'https://empresa.example/painel/redefinir-senha?token=abc-123';
  const { subject, text, html } = passwordResetRequested({
    userName: 'Ana Responsável',
    companyName: 'Demo Serviços',
    resetUrl,
    expiresInMinutes: 60,
  });

  assert.match(subject, /recupera/i);
  assert.ok(text.includes(resetUrl));
  assert.ok(html.includes(resetUrl));
  assert.ok(text.includes('60'));
  assert.match(text, /não pediu/i);
});

test('e-mail de recuperação não carrega a senha nem o token isolado', () => {
  const { text, html } = passwordResetRequested({
    userName: 'Ana',
    companyName: 'Demo',
    resetUrl: 'https://e.example/painel/redefinir-senha?token=t',
    expiresInMinutes: 60,
  });

  for (const corpo of [text, html]) {
    assert.ok(!/senha atual[^.]*é/i.test(corpo));
    assert.ok(!/password/i.test(corpo));
  }
});

test('nome do usuário é escapado no HTML do e-mail', () => {
  const { html } = passwordResetRequested({
    userName: '<script>alert(1)</script>',
    companyName: 'Demo',
    resetUrl: 'https://e.example/x',
    expiresInMinutes: 60,
  });

  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
