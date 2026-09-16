import assert from 'node:assert/strict';
import test from 'node:test';
import { PANEL_HOME, safeNextPath } from '../src/lib/auth/next-path.js';
import { validateLoginInput } from '../src/lib/auth/schema.js';

test('normaliza o e-mail para minúsculas e sem espaços', () => {
  const { success, data } = validateLoginInput({
    email: '  Ana@Empresa.COM  ',
    password: 'senha-secreta',
  });

  // Sem normalizar, o mesmo usuário não entraria por digitar com maiúscula.
  assert.equal(success, true);
  assert.equal(data.email, 'ana@empresa.com');
});

test('a senha não é alterada pela validação', () => {
  const senha = '  espaços  importam  ';
  const { data } = validateLoginInput({ email: 'a@b.com', password: senha });

  // Aparar a senha mudaria silenciosamente a credencial de quem a escolheu.
  assert.equal(data.password, senha);
});

test('campos ausentes viram erro por campo', () => {
  const { success, errors } = validateLoginInput({});

  assert.equal(success, false);
  assert.ok(errors.email);
  assert.ok(errors.password);
});

test('e-mail inválido é recusado', () => {
  const { success, errors } = validateLoginInput({
    email: 'sem-arroba',
    password: 'senha-secreta',
  });

  assert.equal(success, false);
  assert.ok(errors.email);
});

test('o login não aplica a política de força de senha', () => {
  // Usuário antigo com senha curta precisa conseguir entrar para trocá-la.
  const { success } = validateLoginInput({ email: 'a@b.com', password: 'x' });
  assert.equal(success, true);
});

test('next só aceita caminho interno do painel', () => {
  assert.equal(safeNextPath('/painel/manifestacoes'), '/painel/manifestacoes');
  assert.equal(safeNextPath('/painel'), '/painel');
});

test('next recusa destino externo', () => {
  for (const destino of [
    'https://golpe.example',
    '//golpe.example',
    '/\\golpe.example',
    'http://golpe.example',
    '/outra-rota',
    '/painelzinho',
    'javascript:alert(1)',
    '',
    null,
    undefined,
    42,
  ]) {
    assert.equal(safeNextPath(destino), PANEL_HOME);
  }
});

test('next não devolve ao próprio login', () => {
  assert.equal(safeNextPath('/painel/login'), PANEL_HOME);
  assert.equal(safeNextPath('/painel/login/qualquer'), PANEL_HOME);
});
