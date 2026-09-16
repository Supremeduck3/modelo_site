import assert from 'node:assert/strict';
import test from 'node:test';
import {
  submissionReceivedForTeam,
  submissionReceivedForVisitor,
} from '../src/server/modules/mail/messages.js';

const SUBMISSION = {
  protocol: '2026-A7K2-9QX4',
  type: 'complaint',
  title: 'Atendimento demorado na unidade central',
  description: 'Aguardei mais de uma hora.\n\nNinguém informou a previsão.',
  contactName: 'Joana Lima',
  contactEmail: 'joana@exemplo.com',
  contactPhone: '11999990000',
  createdAt: new Date('2026-09-16T14:30:00Z'),
};

const BASE = { companyName: 'Demo Serviços', typeLabel: 'Reclamação' };

test('confirmação ao visitante leva o protocolo no assunto e no corpo', () => {
  const { subject, text, html } = submissionReceivedForVisitor({
    submission: SUBMISSION,
    ...BASE,
  });

  assert.ok(subject.includes(SUBMISSION.protocol));
  assert.ok(text.includes(SUBMISSION.protocol));
  assert.ok(html.includes(SUBMISSION.protocol));
  assert.ok(text.includes('Reclamação'));
});

test('confirmação ao visitante não devolve o que é de uso interno', () => {
  const { subject, text, html } = submissionReceivedForVisitor({
    submission: { ...SUBMISSION, status: 'new', priority: 'urgent' },
    ...BASE,
  });

  // A descrição e o contato são dele, mas repetir isso por e-mail amplia o
  // estrago de um encaminhamento errado — e situação/prioridade são internas.
  for (const conteudo of [subject, text, html]) {
    assert.equal(conteudo.includes(SUBMISSION.description), false);
    assert.equal(conteudo.includes('urgent'), false);
    assert.equal(conteudo.includes(SUBMISSION.contactPhone), false);
  }
});

test('aviso à equipe leva descrição, contato e link do painel', () => {
  const { subject, text, html } = submissionReceivedForTeam({
    submission: SUBMISSION,
    ...BASE,
    panelUrl: 'https://demo.example/painel',
  });

  assert.ok(subject.includes(SUBMISSION.protocol));
  assert.ok(text.includes('Aguardei mais de uma hora.'));
  assert.ok(text.includes(SUBMISSION.contactEmail));
  assert.ok(text.includes('https://demo.example/painel'));
  assert.ok(html.includes('https://demo.example/painel'));
});

test('aviso à equipe responde para o visitante quando há e-mail', () => {
  const comEmail = submissionReceivedForTeam({
    submission: SUBMISSION,
    ...BASE,
  });
  assert.equal(comEmail.replyTo, SUBMISSION.contactEmail);

  const semEmail = submissionReceivedForTeam({
    submission: { ...SUBMISSION, contactEmail: null },
    ...BASE,
  });
  assert.equal(semEmail.replyTo, undefined);
});

test('aviso à equipe funciona sem contato e sem link', () => {
  const { text, html } = submissionReceivedForTeam({
    submission: {
      ...SUBMISSION,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
    },
    ...BASE,
  });

  assert.ok(text.includes('não informado'));
  // Sem painelUrl não sobra botão vazio nem href quebrado.
  assert.equal(html.includes('href'), false);
  assert.equal(text.includes('Abrir no painel'), false);
});

test('conteúdo do visitante é escapado no HTML', () => {
  const ataque = '<script>alert(1)</script>';
  const submission = {
    ...SUBMISSION,
    title: ataque,
    description: `aspas " e ' e ${ataque}`,
  };

  for (const { html } of [
    submissionReceivedForVisitor({ submission, ...BASE }),
    submissionReceivedForTeam({ submission, ...BASE }),
  ]) {
    // O corpo do e-mail é HTML: texto livre do formulário não pode virar tag.
    assert.equal(html.includes('<script>'), false);
    assert.ok(html.includes('&lt;script&gt;'));
  }
});

test('nome da empresa também é escapado', () => {
  const { html } = submissionReceivedForVisitor({
    submission: SUBMISSION,
    typeLabel: 'Reclamação',
    companyName: 'Demo <img src=x onerror=alert(1)>',
  });

  assert.equal(html.includes('<img'), false);
  assert.ok(html.includes('&lt;img'));
});

test('quebras de linha da descrição viram parágrafos, não texto corrido', () => {
  const { html } = submissionReceivedForTeam({
    submission: SUBMISSION,
    ...BASE,
  });

  assert.ok(html.includes('<p>Aguardei mais de uma hora.</p>'));
  assert.ok(html.includes('<p>Ninguém informou a previsão.</p>'));
});
