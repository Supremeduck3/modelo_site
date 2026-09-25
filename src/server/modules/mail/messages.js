/**
 * Conteúdo das mensagens transacionais.
 *
 * Funções puras e sem import nenhum: recebem dados — inclusive o rótulo do tipo
 * já resolvido por quem chama —, devolvem `{ subject, text, html }` e não tocam
 * em SMTP, banco nem ambiente. É o que permite conferir em teste exatamente o
 * que sai, sem servidor de e-mail.
 *
 * Toda mensagem vai em texto **e** HTML. O texto não é cortesia: cliente que
 * bloqueia HTML mostra só ele, e é o que sobra quando o e-mail é lido por
 * leitor de tela em modo simples.
 */

/**
 * Escapa o que veio do visitante antes de entrar no HTML.
 *
 * O assunto e a descrição são texto livre de quem preencheu o formulário. Sem
 * escape, uma manifestação com `<script>` viraria injeção na caixa de entrada
 * de quem abre o aviso — o corpo do e-mail é HTML como qualquer página.
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Parágrafos de HTML a partir de texto com quebras de linha. */
function paragraphs(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br>')}</p>`)
    .join('\n');
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

function formatDate(value) {
  return dateFormatter.format(value ? new Date(value) : new Date());
}

/** Casca HTML mínima. E-mail não tem CSS externo: estilo vai inline. */
function layout({ title, body, footer }) {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fa;font-family:system-ui,-apple-system,sans-serif;color:#16202e;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px">
    <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
    ${body}
    ${footer ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #dde3ec;color:#5b6982;font-size:13px">${escapeHtml(footer)}</p>` : ''}
  </div>
</body>
</html>`;
}

/**
 * Confirmação para o visitante que registrou uma manifestação.
 *
 * Leva o protocolo e só o que ele mesmo informou. Nada de situação interna,
 * responsável ou nota: o que o painel anota não transita por aqui.
 */
export function submissionReceivedForVisitor({
  submission,
  companyName,
  typeLabel,
}) {
  const registeredAt = formatDate(submission.createdAt);

  const subject = `Recebemos sua manifestação — protocolo ${submission.protocol}`;

  const text = [
    `Recebemos sua manifestação em ${companyName}.`,
    '',
    `Protocolo: ${submission.protocol}`,
    `Tipo: ${typeLabel}`,
    `Assunto: ${submission.title}`,
    `Registrada em: ${registeredAt}`,
    '',
    'Guarde o protocolo: é com ele que você acompanha o andamento.',
    '',
    'Esta mensagem é automática. Se você não registrou esta manifestação,',
    'ignore este e-mail.',
  ].join('\n');

  const html = layout({
    title: 'Recebemos sua manifestação',
    body: `
    <p>Recebemos sua manifestação em <strong>${escapeHtml(companyName)}</strong>.</p>
    <p style="margin:24px 0;padding:16px;background:#f5f7fa;border-radius:8px;text-align:center">
      <span style="display:block;color:#5b6982;font-size:13px">Protocolo</span>
      <strong style="font-size:22px;letter-spacing:0.08em">${escapeHtml(submission.protocol)}</strong>
    </p>
    <p>
      <strong>Tipo:</strong> ${escapeHtml(typeLabel)}<br>
      <strong>Assunto:</strong> ${escapeHtml(submission.title)}<br>
      <strong>Registrada em:</strong> ${escapeHtml(registeredAt)}
    </p>
    <p>Guarde o protocolo: é com ele que você acompanha o andamento.</p>`,
    footer:
      'Esta mensagem é automática. Se você não registrou esta manifestação, ignore este e-mail.',
  });

  return { subject, text, html };
}

/**
 * Aviso à equipe de que entrou uma manifestação nova.
 *
 * O contato do visitante vai em `replyTo` quando existe, para responder ser um
 * "responder" no cliente de e-mail — mas a resposta oficial continua sendo a do
 * painel, que fica registrada no histórico.
 */
export function submissionReceivedForTeam({
  submission,
  companyName,
  typeLabel,
  panelUrl,
}) {
  const registeredAt = formatDate(submission.createdAt);
  const contact =
    [submission.contactName, submission.contactEmail, submission.contactPhone]
      .filter(Boolean)
      .join(' · ') || 'não informado';

  const subject = `Nova manifestação: ${typeLabel} — ${submission.protocol}`;

  const text = [
    `Entrou uma manifestação nova em ${companyName}.`,
    '',
    `Protocolo: ${submission.protocol}`,
    `Tipo: ${typeLabel}`,
    `Assunto: ${submission.title}`,
    `Contato: ${contact}`,
    `Registrada em: ${registeredAt}`,
    '',
    'Descrição:',
    submission.description,
    ...(panelUrl ? ['', `Abrir no painel: ${panelUrl}`] : []),
  ].join('\n');

  const html = layout({
    title: `Nova manifestação: ${typeLabel}`,
    body: `
    <p>
      <strong>Protocolo:</strong> ${escapeHtml(submission.protocol)}<br>
      <strong>Assunto:</strong> ${escapeHtml(submission.title)}<br>
      <strong>Contato:</strong> ${escapeHtml(contact)}<br>
      <strong>Registrada em:</strong> ${escapeHtml(registeredAt)}
    </p>
    <div style="margin:24px 0;padding:16px;background:#f5f7fa;border-radius:8px">
      ${paragraphs(submission.description)}
    </div>
    ${
      panelUrl
        ? `<p><a href="${escapeHtml(panelUrl)}" style="display:inline-block;padding:12px 20px;background:#1f6feb;color:#ffffff;border-radius:8px;text-decoration:none">Abrir no painel</a></p>`
        : ''
    }`,
    footer: `Aviso automático do canal de manifestações de ${companyName}.`,
  });

  return { subject, text, html, replyTo: submission.contactEmail ?? undefined };
}

/**
 * Link de recuperação de senha para um usuário do painel.
 *
 * Só o link e o prazo. Nada de "clique aqui se não foi você mudar sua senha"
 * com ação embutida: a única ação possível é abrir o link, e quem não pediu
 * simplesmente ignora — o pedido sozinho não altera nada na conta.
 */
export function passwordResetRequested({
  userName,
  companyName,
  resetUrl,
  expiresInMinutes,
}) {
  const subject = `Recuperação de acesso ao painel — ${companyName}`;

  const text = [
    `Olá, ${userName}.`,
    '',
    `Recebemos um pedido para redefinir a senha de acesso ao painel de ${companyName}.`,
    '',
    'Abra o endereço abaixo para definir uma nova senha:',
    resetUrl,
    '',
    `O link vale por ${expiresInMinutes} minutos e só pode ser usado uma vez.`,
    'Se você não pediu a recuperação, ignore esta mensagem: sua senha atual continua valendo.',
  ].join('\n');

  const html = layout({
    title: 'Recuperação de acesso',
    body: `
    <p>Olá, ${escapeHtml(userName)}.</p>
    <p>
      Recebemos um pedido para redefinir a senha de acesso ao painel de
      ${escapeHtml(companyName)}.
    </p>
    <p>
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 20px;background:#1f6feb;color:#ffffff;border-radius:8px;text-decoration:none">Definir nova senha</a>
    </p>
    <p style="color:#5b6982;font-size:14px">
      O link vale por ${escapeHtml(expiresInMinutes)} minutos e só pode ser usado uma vez.
      Se você não pediu a recuperação, ignore esta mensagem: sua senha atual
      continua valendo.
    </p>`,
    footer: `Mensagem automática do painel de ${companyName}.`,
  });

  return { subject, text, html };
}

/**
 * Resposta da empresa ao visitante que registrou a manifestação.
 *
 * Leva o protocolo, o assunto e o texto que a equipe escreveu para ser enviado
 * — nada mais. Situação interna, responsável, prioridade e notas ficam de fora
 * por definição: o que o painel anota não transita por aqui.
 */
export function submissionAnsweredForVisitor({
  submission,
  companyName,
  typeLabel,
  response,
}) {
  const subject = `Resposta à sua manifestação ${submission.protocol}`;
  const greeting = submission.contactName
    ? `Olá, ${submission.contactName}.`
    : 'Olá.';

  const text = [
    greeting,
    '',
    `${companyName} respondeu à manifestação que você registrou.`,
    '',
    `Protocolo: ${submission.protocol}`,
    `Tipo: ${typeLabel}`,
    `Assunto: ${submission.title}`,
    '',
    'Resposta:',
    response,
    '',
    'Se precisar complementar, responda a este e-mail informando o protocolo.',
  ].join('\n');

  const html = layout({
    title: 'Resposta à sua manifestação',
    body: `
    <p>${escapeHtml(greeting)}</p>
    <p>${escapeHtml(companyName)} respondeu à manifestação que você registrou.</p>
    <p>
      <strong>Protocolo:</strong> ${escapeHtml(submission.protocol)}<br>
      <strong>Tipo:</strong> ${escapeHtml(typeLabel)}<br>
      <strong>Assunto:</strong> ${escapeHtml(submission.title)}
    </p>
    <div style="margin:24px 0;padding:16px;background:#f5f7fa;border-radius:8px">
      ${paragraphs(response)}
    </div>
    <p style="color:#5b6982;font-size:14px">
      Se precisar complementar, responda a este e-mail informando o protocolo.
    </p>`,
    footer: `Mensagem do canal de manifestações de ${companyName}.`,
  });

  return { subject, text, html };
}

/**
 * Convite de acesso ao painel.
 *
 * Leva o link e o prazo. Não leva senha: quem aceita escolhe a própria, e
 * senha nenhuma trafega por e-mail.
 */
export function memberInvited({
  memberName,
  companyName,
  invitedByName,
  inviteUrl,
  expiresInDays,
}) {
  const subject = `Acesso ao painel de ${companyName}`;
  const quem = invitedByName ? `${invitedByName} ` : '';

  const text = [
    `Olá, ${memberName}.`,
    '',
    `${quem}convidou você para o painel de ${companyName}, onde a equipe acompanha as manifestações recebidas pelo site.`,
    '',
    'Abra o endereço abaixo para definir sua senha e ativar o acesso:',
    inviteUrl,
    '',
    `O convite vale por ${expiresInDays} dias e só pode ser usado uma vez.`,
    'Se você não esperava este convite, ignore esta mensagem.',
  ].join('\n');

  const html = layout({
    title: 'Convite para o painel',
    body: `
    <p>Olá, ${escapeHtml(memberName)}.</p>
    <p>
      ${escapeHtml(quem)}convidou você para o painel de
      ${escapeHtml(companyName)}, onde a equipe acompanha as manifestações
      recebidas pelo site.
    </p>
    <p>
      <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 20px;background:#1f6feb;color:#ffffff;border-radius:8px;text-decoration:none">Definir minha senha</a>
    </p>
    <p style="color:#5b6982;font-size:14px">
      O convite vale por ${escapeHtml(expiresInDays)} dias e só pode ser usado
      uma vez. Se você não esperava este convite, ignore esta mensagem.
    </p>`,
    footer: `Mensagem automática do painel de ${companyName}.`,
  });

  return { subject, text, html };
}

/**
 * Aviso à equipe de um pedido de agendamento novo.
 *
 * `when` e `phone` chegam formatados por quem chama (dia por extenso, período,
 * telefone legível): esta função continua sem saber de datas nem de máscara.
 * O telefone vai no corpo porque é por ele que a equipe confirma.
 */
export function appointmentRequestedForTeam({
  appointment,
  companyName,
  when,
  phone,
  panelUrl,
}) {
  const subject = `Novo pedido de horário — ${appointment.serviceName} (${appointment.code})`;

  const linhas = [
    `Novo pedido de agendamento em ${companyName}.`,
    '',
    `Serviço: ${appointment.serviceName}`,
    appointment.professional
      ? `Profissional de preferência: ${appointment.professional}`
      : null,
    `Quando: ${when}`,
    `Cliente: ${appointment.customerName}`,
    `WhatsApp: ${phone}`,
    appointment.customerEmail ? `E-mail: ${appointment.customerEmail}` : null,
    appointment.notes ? `\nObservação:\n${appointment.notes}` : null,
    '',
    panelUrl
      ? `Confirme ou proponha outro horário no painel: ${panelUrl}`
      : 'Confirme ou proponha outro horário no painel da empresa.',
  ].filter((linha) => linha !== null);

  const text = linhas.join('\n');

  const html = layout({
    title: 'Novo pedido de horário',
    body: `${paragraphs(linhas.slice(0, -1).join('\n'))}
${
  panelUrl
    ? `<p><a href="${escapeHtml(panelUrl)}" style="display:inline-block;padding:10px 18px;background:#1f6feb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">Abrir no painel</a></p>`
    : '<p>Confirme ou proponha outro horário no painel da empresa.</p>'
}`,
    footer: `Código do pedido: ${appointment.code}`,
  });

  return {
    subject,
    text,
    html,
    replyTo: appointment.customerEmail ?? undefined,
  };
}

/**
 * Aviso ao cliente de uma decisão sobre o pedido (confirmado, novo horário,
 * recusado, cancelado).
 *
 * O texto é o mesmo que a equipe manda pelo WhatsApp — montado em
 * lib/booking/messages.js — para o cliente não receber duas versões da mesma
 * notícia.
 */
export function appointmentUpdateForCustomer({ subject, message, code }) {
  return {
    subject,
    text: message,
    html: layout({
      title: subject,
      body: paragraphs(message),
      footer: `Código do pedido: ${code}`,
    }),
  };
}
