import { BOOKING_PERIODS, labelOf } from './constants.js';
import { formatDateLong, formatDateShort, toYmd } from './dates.js';

/**
 * Textos que vão para o cliente sobre o pedido de agendamento.
 *
 * Um lugar só para a mensagem do WhatsApp (que a empresa envia do próprio
 * celular, pelo link do painel) e para o e-mail automático: o cliente recebe a
 * mesma informação pelos dois caminhos.
 */

/** Primeiro nome, para a mensagem soar como conversa e não como sistema. */
function primeiroNome(nome) {
  return (
    String(nome ?? '')
      .trim()
      .split(/\s+/)[0] || 'tudo bem'
  );
}

function horario(appointment) {
  const dia = toYmd(appointment.scheduledDate);
  if (!dia || !appointment.scheduledTime) return null;
  return `${formatDateLong(dia)} (${formatDateShort(dia)}), às ${appointment.scheduledTime}`;
}

function pedido(appointment) {
  const dia = toYmd(appointment.requestedDate);
  return `${formatDateLong(dia)}, ${labelOf(BOOKING_PERIODS, appointment.requestedPeriod).toLowerCase()}`;
}

/**
 * Mensagem para o cliente depois de uma ação da equipe.
 *
 * `status` é o novo status; `companyName` assina. Devolve `null` para status
 * que não pedem aviso (o próprio pedido recém-criado, por exemplo).
 */
export function customerMessage({
  appointment,
  status,
  companyName,
  trackingUrl,
}) {
  const ola = `Olá, ${primeiroNome(appointment.customerName)}!`;
  const servico = appointment.serviceName;
  const recado = appointment.responseMessage
    ? `\n\n${appointment.responseMessage}`
    : '';
  const acompanhar = trackingUrl ? `\n\nAcompanhe: ${trackingUrl}` : '';
  const assinatura = `\n\n${companyName}`;

  switch (status) {
    case 'confirmed':
      return `${ola} Seu horário de ${servico} está confirmado para ${horario(appointment)}.${recado}${acompanhar}${assinatura}`;
    case 'proposed':
      return `${ola} Para ${servico}, não conseguimos o horário que você pediu (${pedido(appointment)}). Podemos te atender em ${horario(appointment)}. Esse horário funciona para você?${recado}${acompanhar}${assinatura}`;
    case 'declined':
      return `${ola} Infelizmente não conseguimos atender o pedido de ${servico} para ${pedido(appointment)}.${recado} Se quiser, faça um novo pedido em outro dia.${assinatura}`;
    case 'cancelled':
      return `${ola} Seu horário de ${servico}${horario(appointment) ? ` (${horario(appointment)})` : ''} foi cancelado.${recado}${assinatura}`;
    default:
      return null;
  }
}

/** Assunto do e-mail para cada aviso. */
export function customerSubject({ status, companyName }) {
  const assuntos = {
    confirmed: 'Horário confirmado',
    proposed: 'Proposta de novo horário',
    declined: 'Sobre o seu pedido de horário',
    cancelled: 'Horário cancelado',
  };
  return assuntos[status] ? `${assuntos[status]} — ${companyName}` : null;
}
