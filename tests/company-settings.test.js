import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateCategory,
  validateCategoryActive,
  validateCompanySettings,
} from '../src/lib/company/schema.js';

const EMPRESA_VALIDA = {
  name: 'Demo Serviços',
  email: 'contato@demo.example',
  phone: '(11) 4000-0000',
  website: 'https://demo.example',
  description: 'Serviços locais.',
  segment: 'Serviços',
  city: 'São Paulo',
  state: 'SP',
  businessHours: [{ days: 'Segunda a sexta', hours: '08h às 18h' }],
};

test('categoria exige nome com conteúdo', () => {
  assert.equal(validateCategory({ name: ' ' }).success, false);
  assert.equal(validateCategory({ name: 'a' }).success, false);
  assert.equal(validateCategory({ name: 'Atendimento' }).success, true);
});

test('descrição vazia da categoria vira null, não string vazia', () => {
  const { data } = validateCategory({ name: 'Financeiro', description: '  ' });
  assert.equal(data.description, null);
});

test('situação da categoria precisa ser booleana', () => {
  assert.equal(validateCategoryActive({ isActive: 'false' }).success, false);
  assert.equal(validateCategoryActive({ isActive: true }).success, true);
});

test('dados da empresa aceitam um preenchimento completo', () => {
  const { success, data } = validateCompanySettings(EMPRESA_VALIDA);
  assert.ok(success);
  assert.equal(data.email, 'contato@demo.example');
  assert.equal(data.businessHours.length, 1);
});

test('empresa sem nome é recusada', () => {
  const { success, errors } = validateCompanySettings({
    ...EMPRESA_VALIDA,
    name: ' ',
  });
  assert.equal(success, false);
  assert.ok(errors.name);
});

test('campos opcionais vazios viram null', () => {
  const { data } = validateCompanySettings({
    ...EMPRESA_VALIDA,
    phone: '',
    segment: '',
    website: '',
    email: '',
  });

  assert.equal(data.phone, null);
  assert.equal(data.segment, null);
  assert.equal(data.website, null);
  assert.equal(data.email, null);
});

test('site precisa de esquema http(s), para o link não quebrar no e-mail', () => {
  const semEsquema = validateCompanySettings({
    ...EMPRESA_VALIDA,
    website: 'demo.example',
  });
  assert.equal(semEsquema.success, false);
  assert.ok(semEsquema.errors.website);

  const comEsquema = validateCompanySettings({
    ...EMPRESA_VALIDA,
    website: 'https://demo.example',
  });
  assert.equal(comEsquema.success, true);
});

test('apagar o e-mail é permitido e chega como null, não como texto', () => {
  // Regressão: o preprocess convertia null em String(null) === "null" e a
  // empresa que apagava o e-mail recebia "informe um e-mail válido".
  for (const vazio of [null, '', '   ', undefined]) {
    const { success, data } = validateCompanySettings({
      ...EMPRESA_VALIDA,
      email: vazio,
    });

    assert.ok(success, `e-mail ${JSON.stringify(vazio)} deveria ser aceito`);
    assert.equal(data.email, null);
    assert.ok('email' in data, 'a chave precisa existir para limpar no banco');
  }
});

test('e-mail malformado da empresa é recusado', () => {
  const { success, errors } = validateCompanySettings({
    ...EMPRESA_VALIDA,
    email: 'contato@',
  });
  assert.equal(success, false);
  assert.ok(errors.email);
});

test('horário de atendimento tem teto de faixas', () => {
  const muitas = Array.from({ length: 8 }, (_, index) => ({
    days: `Dia ${index}`,
    hours: '08h às 18h',
  }));

  const { success, errors } = validateCompanySettings({
    ...EMPRESA_VALIDA,
    businessHours: muitas,
  });
  assert.equal(success, false);
  assert.ok(errors.businessHours);
});

test('faixa de horário incompleta é recusada', () => {
  const { success } = validateCompanySettings({
    ...EMPRESA_VALIDA,
    businessHours: [{ days: 'Segunda', hours: '' }],
  });
  assert.equal(success, false);
});

test('empresa sem horários é válida e vira lista vazia', () => {
  const { success, data } = validateCompanySettings({
    ...EMPRESA_VALIDA,
    businessHours: undefined,
  });
  assert.ok(success);
  assert.deepEqual(data.businessHours, []);
});

test('modo comercial desconhecido vira aviso, não derruba o site', async () => {
  const { validateSiteConfig } = await import('../src/config/site/schema.js');

  const base = {
    identity: { name: 'X' },
    navigation: { items: [{ label: 'a', href: '/' }] },
    pages: { home: { sections: [{ type: 'hero', variant: 'split' }] } },
  };

  const valido = validateSiteConfig({
    ...base,
    deployment: { mode: 'avulso' },
  });
  assert.equal(valido.config.deployment.mode, 'avulso');
  assert.equal(valido.errors.length, 0);

  const invalido = validateSiteConfig({
    ...base,
    deployment: { mode: 'inventado' },
  });
  assert.equal(invalido.config.deployment.mode, 'assinatura');
  assert.equal(
    invalido.errors.length,
    0,
    'é registro administrativo, não erro',
  );
  assert.ok(invalido.warnings.some((w) => w.includes('deployment.mode')));
});
