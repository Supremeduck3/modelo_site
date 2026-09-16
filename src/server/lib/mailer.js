import nodemailer from 'nodemailer';

/**
 * Envio de e-mail transacional da implantação.
 *
 * Duas regras que o resto do código depende:
 *
 * 1. **Nunca lança.** Quem chama está no meio de um fluxo do visitante ou da
 *    equipe; uma caixa de e-mail fora do ar não pode virar erro de quem
 *    registrou uma manifestação. Falha vira log e `{ sent: false }`.
 * 2. **Sem SMTP configurado, não envia e não reclama em produção.** Uma
 *    implantação pode começar sem e-mail; em desenvolvimento a mensagem vai
 *    para o log, para dar para conferir o conteúdo sem servidor de e-mail.
 */

const globalForMailer = globalThis;

/** Motivos de não-envio, para o chamador logar sem interpretar string. */
export const MAIL_SKIPPED = {
  NOT_CONFIGURED: 'not_configured',
  NO_RECIPIENT: 'no_recipient',
};

function readConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM?.trim();

  if (!host || !from || !Number.isInteger(port)) return null;

  return {
    host,
    port,
    from,
    // 465 é SMTPS (TLS desde o handshake); as outras portas sobem para TLS
    // via STARTTLS. Não existe caminho sem cifra aqui.
    secure: port === 465,
    auth: user ? { user, pass: password } : undefined,
  };
}

/** Diz se a implantação tem e-mail configurado. */
export function isMailConfigured() {
  return readConfig() !== null;
}

/**
 * Transporte único por processo.
 *
 * Cacheado no globalThis pelo mesmo motivo do cliente Prisma: o hot reload
 * recriaria o pool de conexões SMTP a cada alteração.
 */
function getTransport(config) {
  if (!globalForMailer.mailTransport) {
    globalForMailer.mailTransport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: true,
      maxConnections: 2,
    });
  }
  return globalForMailer.mailTransport;
}

/**
 * Envia uma mensagem. Devolve `{ sent, reason? }` e nunca lança.
 *
 * `to` aceita um endereço ou uma lista; lista vazia é não-envio, não erro.
 */
export async function sendMail({ to, subject, text, html, replyTo }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);

  if (recipients.length === 0) {
    return { sent: false, reason: MAIL_SKIPPED.NO_RECIPIENT };
  }

  const config = readConfig();

  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `[mail] SMTP não configurado; mensagem não enviada.\n` +
          `  para: ${recipients.join(', ')}\n` +
          `  assunto: ${subject}\n` +
          `${text}`,
      );
    }
    return { sent: false, reason: MAIL_SKIPPED.NOT_CONFIGURED };
  }

  try {
    await getTransport(config).sendMail({
      from: config.from,
      to: recipients.join(', '),
      replyTo,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (error) {
    // O assunto entra no log, o corpo não: pode ter dado pessoal do visitante.
    console.error(
      `[mail] falha ao enviar "${subject}" para ${recipients.length} destinatário(s)`,
      error,
    );
    return { sent: false, reason: 'send_failed' };
  }
}
