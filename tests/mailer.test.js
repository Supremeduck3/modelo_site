import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isMailConfigured,
  MAIL_SKIPPED,
  sendMail,
} from '../src/server/lib/mailer.js';

const VARS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'MAIL_FROM',
];

/** Roda `fn` com as variáveis de SMTP trocadas, restaurando-as depois. */
async function comAmbiente(vars, fn) {
  const anterior = Object.fromEntries(
    VARS.map((key) => [key, process.env[key]]),
  );

  for (const key of VARS) delete process.env[key];
  for (const [key, value] of Object.entries(vars)) process.env[key] = value;

  try {
    return await fn();
  } finally {
    for (const key of VARS) {
      if (anterior[key] === undefined) delete process.env[key];
      else process.env[key] = anterior[key];
    }
  }
}

const MENSAGEM = {
  to: 'alguem@exemplo.com',
  subject: 'Assunto',
  text: 'Corpo',
  html: '<p>Corpo</p>',
};

test('sem SMTP configurado não envia e não lança', async () => {
  await comAmbiente({}, async () => {
    assert.equal(isMailConfigured(), false);

    // Uma implantação pode rodar sem e-mail; isso não pode virar exceção no
    // meio do registro de uma manifestação.
    const result = await sendMail(MENSAGEM);
    assert.deepEqual(result, {
      sent: false,
      reason: MAIL_SKIPPED.NOT_CONFIGURED,
    });
  });
});

test('configuração pela metade conta como não configurada', async () => {
  // Host sem remetente não envia: o servidor recusaria, e descobrir isso no
  // meio do fluxo é pior que não tentar.
  await comAmbiente({ SMTP_HOST: 'smtp.exemplo.com' }, () => {
    assert.equal(isMailConfigured(), false);
  });

  await comAmbiente({ MAIL_FROM: 'canal@exemplo.com' }, () => {
    assert.equal(isMailConfigured(), false);
  });

  await comAmbiente(
    { SMTP_HOST: 'smtp.exemplo.com', MAIL_FROM: 'canal@exemplo.com' },
    () => {
      assert.equal(isMailConfigured(), true);
    },
  );
});

test('porta inválida não passa por configuração', async () => {
  await comAmbiente(
    {
      SMTP_HOST: 'smtp.exemplo.com',
      MAIL_FROM: 'canal@exemplo.com',
      SMTP_PORT: 'não-é-número',
    },
    () => {
      assert.equal(isMailConfigured(), false);
    },
  );
});

test('sem destinatário não envia, mesmo com SMTP configurado', async () => {
  await comAmbiente(
    { SMTP_HOST: 'smtp.exemplo.com', MAIL_FROM: 'canal@exemplo.com' },
    async () => {
      for (const to of [null, undefined, '', [], [null, '']]) {
        const result = await sendMail({ ...MENSAGEM, to });
        assert.deepEqual(result, {
          sent: false,
          reason: MAIL_SKIPPED.NO_RECIPIENT,
        });
      }
    },
  );
});
