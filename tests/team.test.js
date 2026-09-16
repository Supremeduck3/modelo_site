import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLE_VALUES, roleLabel } from '../src/lib/auth/constants.js';
import { PASSWORD_MIN_LENGTH } from '../src/lib/auth/password-rules.js';
import {
  ASSIGNABLE_ROLES,
  validateAcceptInvite,
  validateChangeRole,
  validateInviteMember,
  validateSetActive,
  validateTransferOwnership,
} from '../src/lib/team/schema.js';

test('o papel de responsável não é atribuível livremente', () => {
  assert.ok(ROLE_VALUES.includes('owner'));
  assert.ok(
    !ASSIGNABLE_ROLES.includes('owner'),
    'owner só pode mudar pela transferência',
  );
  assert.deepEqual(ASSIGNABLE_ROLES, ['admin', 'operator']);
});

test('convite normaliza o e-mail e aceita perfis válidos', () => {
  const { success, data } = validateInviteMember({
    name: '  Joana Lima  ',
    email: '  Joana@Exemplo.COM ',
    role: 'operator',
  });

  assert.ok(success);
  assert.equal(data.name, 'Joana Lima');
  assert.equal(data.email, 'joana@exemplo.com');
});

test('convite recusa tentativa de criar outro responsável', () => {
  const { success, errors } = validateInviteMember({
    name: 'Alguém',
    email: 'alguem@exemplo.com',
    role: 'owner',
  });

  assert.equal(success, false);
  assert.ok(errors.role);
});

test('convite exige nome e e-mail utilizáveis', () => {
  const semNome = validateInviteMember({
    name: ' ',
    email: 'a@b.com',
    role: 'admin',
  });
  assert.equal(semNome.success, false);
  assert.ok(semNome.errors.name);

  const emailRuim = validateInviteMember({
    name: 'Fulano',
    email: 'nao-e-email',
    role: 'admin',
  });
  assert.equal(emailRuim.success, false);
  assert.ok(emailRuim.errors.email);
});

test('troca de perfil não aceita owner', () => {
  assert.equal(validateChangeRole({ role: 'owner' }).success, false);
  assert.equal(validateChangeRole({ role: 'admin' }).success, true);
});

test('situação do acesso precisa ser booleana, não string da URL', () => {
  assert.equal(validateSetActive({ isActive: 'false' }).success, false);
  assert.equal(validateSetActive({ isActive: false }).success, true);
});

test('aceite do convite aplica a política de senha', () => {
  const curta = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
  const { success, errors } = validateAcceptInvite({
    token: 'tok',
    password: curta,
    passwordConfirmation: curta,
  });

  assert.equal(success, false);
  assert.match(errors.password, new RegExp(String(PASSWORD_MIN_LENGTH)));
});

test('aceite do convite exige confirmação igual e token presente', () => {
  const divergente = validateAcceptInvite({
    token: 'tok',
    password: 'senha-bem-comprida',
    passwordConfirmation: 'senha-bem-compridb',
  });
  assert.equal(divergente.success, false);
  assert.ok(divergente.errors.passwordConfirmation);

  const semToken = validateAcceptInvite({
    token: '   ',
    password: 'senha-bem-comprida',
    passwordConfirmation: 'senha-bem-comprida',
  });
  assert.equal(semToken.success, false);
  assert.ok(semToken.errors.token);
});

test('transferência exige confirmação explícita', () => {
  const semConfirmar = validateTransferOwnership({ userId: 'abc' });
  assert.equal(semConfirmar.success, false);
  assert.ok(semConfirmar.errors.confirmation);

  const recusando = validateTransferOwnership({
    userId: 'abc',
    confirmation: false,
  });
  assert.equal(recusando.success, false);

  const ok = validateTransferOwnership({ userId: 'abc', confirmation: true });
  assert.equal(ok.success, true);
});

test('transferência exige escolher alguém', () => {
  const { success, errors } = validateTransferOwnership({
    userId: '',
    confirmation: true,
  });
  assert.equal(success, false);
  assert.ok(errors.userId);
});

test('todo papel tem rótulo legível', () => {
  for (const role of ROLE_VALUES) {
    assert.notEqual(roleLabel(role), role, `papel ${role} sem rótulo`);
  }
});

test('convite não carrega senha nem promete uma', async () => {
  const { memberInvited } = await import(
    '../src/server/modules/mail/messages.js'
  );

  const link = 'https://empresa.example/painel/convite?token=abc';
  const { subject, text, html } = memberInvited({
    memberName: 'Joana',
    companyName: 'Demo Serviços',
    invitedByName: 'Ana',
    inviteUrl: link,
    expiresInDays: 7,
  });

  assert.match(subject, /acesso ao painel/i);
  assert.ok(text.includes(link));
  assert.ok(html.includes(link));
  assert.ok(text.includes('7'));

  // Senha nenhuma trafega por e-mail: o convite leva o link, a pessoa escolhe.
  for (const corpo of [text, html]) {
    assert.ok(!/senha provis[óo]ria/i.test(corpo));
    assert.ok(!/sua senha é/i.test(corpo));
  }
});

test('nome de quem convida é escapado no HTML', async () => {
  const { memberInvited } = await import(
    '../src/server/modules/mail/messages.js'
  );

  const { html } = memberInvited({
    memberName: '<img src=x onerror=alert(1)>',
    companyName: 'Demo',
    invitedByName: '<script>alert(1)</script>',
    inviteUrl: 'https://e.example/x',
    expiresInDays: 7,
  });

  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
});
