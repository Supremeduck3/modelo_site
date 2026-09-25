import {
  BOOKING_PERIODS,
  labelOf as bookingLabel,
} from '@/lib/booking/constants';
import { formatDateLong } from '@/lib/booking/dates';
import { customerMessage, customerSubject } from '@/lib/booking/messages';
import { labelOf, SUBMISSION_TYPES } from '@/lib/submissions/constants';
import { formatPhone } from '@/lib/whatsapp';
import { prisma } from '@/server/db/client';
import { isMailConfigured, sendMail } from '@/server/lib/mailer';
import { RESET_TTL_MS } from '@/server/modules/auth/password-reset';
import { getCurrentCompany } from '@/server/modules/company/service';
import { INVITE_TTL_MS } from '@/server/modules/team/service';
import {
  appointmentRequestedForTeam,
  appointmentUpdateForCustomer,
  memberInvited,
  passwordResetRequested,
  submissionAnsweredForVisitor,
  submissionReceivedForTeam,
  submissionReceivedForVisitor,
} from './messages';

/**
 * Quem é avisado do quê.
 *
 * Camada fina entre o fluxo e o envio: decide destinatários e monta os links,
 * sem saber montar mensagem (isso é `messages.js`) nem falar SMTP (isso é
 * `lib/mailer.js`).
 */

/** Base dos links que vão no e-mail; sem ela o aviso vai sem botão. */
function panelUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  return base ? `${base}/painel` : null;
}

/** E-mails da equipe ativa. Quem foi desativado para de receber aviso. */
async function teamRecipients(companyId) {
  const users = await prisma.companyUser.findMany({
    where: { companyId, isActive: true },
    select: { email: true },
  });
  return users.map((user) => user.email);
}

/**
 * Avisa visitante e equipe de uma manifestação recém-registrada.
 *
 * Os dois envios são independentes: a equipe é avisada mesmo que o visitante
 * não tenha deixado e-mail, e o visitante recebe a confirmação mesmo que a
 * equipe esteja sem ninguém ativo. Nenhuma falha sobe — quem chama já
 * respondeu ao visitante.
 */
export async function notifySubmissionCreated({ submission }) {
  // Sem SMTP não há o que fazer, e nem faz sentido consultar a equipe no banco.
  if (!isMailConfigured()) return;

  try {
    const company = await getCurrentCompany();
    const url = panelUrl();
    const typeLabel = labelOf(SUBMISSION_TYPES, submission.type);

    const visitor = submission.contactEmail
      ? sendMail({
          to: submission.contactEmail,
          ...submissionReceivedForVisitor({
            submission,
            companyName: company.name,
            typeLabel,
          }),
        })
      : Promise.resolve({ sent: false });

    const team = teamRecipients(company.id).then((recipients) =>
      sendMail({
        to: recipients,
        ...submissionReceivedForTeam({
          submission,
          companyName: company.name,
          typeLabel,
          panelUrl: url,
        }),
      }),
    );

    // `allSettled`: um envio quebrado não pode cancelar o outro.
    await Promise.allSettled([visitor, team]);
  } catch (error) {
    // Roda depois da resposta ao visitante: não há a quem devolver erro.
    console.error('[mail] falha ao avisar sobre manifestação nova', error);
  }
}

/**
 * Envia o link de recuperação de senha.
 *
 * Sem SMTP configurado o link vai para o log em desenvolvimento — é o que
 * permite ao implementador testar o fluxo antes de ter servidor de e-mail. Em
 * produção não registramos o link em lugar nenhum: quem lesse o log entraria na
 * conta.
 */
export async function notifyPasswordResetRequested({ user, token }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const resetUrl = `${base ?? ''}/painel/redefinir-senha?token=${encodeURIComponent(token)}`;

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[mail] SMTP ausente; link de recuperação: ${resetUrl}`);
    } else {
      console.warn(
        '[mail] pedido de recuperação sem SMTP configurado: nenhum link foi entregue.',
      );
    }
    return;
  }

  try {
    const company = await getCurrentCompany();

    await sendMail({
      to: user.email,
      ...passwordResetRequested({
        userName: user.name,
        companyName: company.name,
        resetUrl,
        expiresInMinutes: Math.round(RESET_TTL_MS / 60000),
      }),
    });
  } catch (error) {
    // Roda depois da resposta: não há a quem devolver erro.
    console.error('[mail] falha ao enviar link de recuperação', error);
  }
}

/**
 * Entrega ao visitante a resposta escrita pela equipe.
 *
 * Só é chamada quando há e-mail de contato. O texto enviado é exatamente o que
 * a equipe escreveu no campo público — nenhuma nota interna chega aqui, porque
 * nota interna nem faz parte do que `respondToSubmission` devolve.
 */
export async function notifySubmissionAnswered({ submission, response }) {
  if (!isMailConfigured()) return;
  if (!submission?.contactEmail) return;

  try {
    const company = await getCurrentCompany();

    await sendMail({
      to: submission.contactEmail,
      ...submissionAnsweredForVisitor({
        submission,
        companyName: company.name,
        typeLabel: labelOf(SUBMISSION_TYPES, submission.type),
        response,
      }),
    });
  } catch (error) {
    // Roda depois da resposta à equipe: não há a quem devolver erro.
    console.error('[mail] falha ao enviar resposta ao visitante', error);
  }
}

/**
 * Envia o convite de acesso ao painel.
 *
 * Sem SMTP não há envio, e isso não é falha: a rota devolve o link para quem
 * convidou repassar. Em produção o link não vai para o log — quem lesse o log
 * entraria na conta antes da pessoa convidada.
 */
export async function notifyMemberInvited({ member, link, invitedByName }) {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[mail] SMTP ausente; link de convite: ${link}`);
    }
    return;
  }

  try {
    const company = await getCurrentCompany();

    await sendMail({
      to: member.email,
      ...memberInvited({
        memberName: member.name,
        companyName: company.name,
        invitedByName,
        inviteUrl: link,
        expiresInDays: Math.round(INVITE_TTL_MS / (24 * 60 * 60 * 1000)),
      }),
    });
  } catch (error) {
    // Roda depois da resposta: não há a quem devolver erro, e o admin já tem o
    // link na tela.
    console.error('[mail] falha ao enviar convite', error);
  }
}

/** Link público de acompanhamento de um pedido de agendamento. */
export function appointmentTrackingUrl(code) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  return base ? `${base}/agendar/pedido/${encodeURIComponent(code)}` : null;
}

/**
 * Avisa a equipe de um pedido de agendamento novo.
 *
 * Só a equipe: o cliente já viu o código e o link de acompanhamento na tela, e
 * receber "recebemos seu pedido" por e-mail antes da confirmação de verdade só
 * cria a dúvida de qual das duas mensagens vale.
 */
export async function notifyAppointmentRequested({ appointment }) {
  if (!isMailConfigured()) return;

  try {
    const company = await getCurrentCompany();
    const recipients = await teamRecipients(company.id);
    const url = panelUrl();

    await sendMail({
      to: recipients,
      ...appointmentRequestedForTeam({
        appointment,
        companyName: company.name,
        when: `${formatDateLong(appointment.requestedDate)}, ${bookingLabel(BOOKING_PERIODS, appointment.requestedPeriod).toLowerCase()}`,
        phone: formatPhone(appointment.customerPhone),
        panelUrl: url ? `${url}/agenda` : null,
      }),
    });
  } catch (error) {
    // Roda depois da resposta ao cliente: não há a quem devolver erro.
    console.error('[mail] falha ao avisar sobre pedido de agendamento', error);
  }
}

/**
 * Avisa o cliente de uma decisão sobre o pedido, se ele deixou e-mail.
 *
 * O texto é o mesmo que o painel oferece para mandar no WhatsApp.
 */
export async function notifyAppointmentUpdated({ appointment }) {
  if (!isMailConfigured()) return;
  if (!appointment?.customerEmail) return;

  try {
    const company = await getCurrentCompany();
    const message = customerMessage({
      appointment,
      status: appointment.status,
      companyName: company.name,
      trackingUrl: appointmentTrackingUrl(appointment.code),
    });
    const subject = customerSubject({
      status: appointment.status,
      companyName: company.name,
    });
    if (!message || !subject) return;

    await sendMail({
      to: appointment.customerEmail,
      ...appointmentUpdateForCustomer({
        subject,
        message,
        code: appointment.code,
      }),
    });
  } catch (error) {
    console.error('[mail] falha ao avisar cliente sobre agendamento', error);
  }
}
