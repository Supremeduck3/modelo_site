/**
 * Links de conversa no WhatsApp (wa.me), sem API nem conta comercial.
 *
 * É o canal real da maioria dos negócios pequenos: o link abre a conversa já
 * com a mensagem escrita, e quem está do outro lado só aperta enviar. Não há
 * integração, custo ou token — e por isso nada aqui quebra se o WhatsApp mudar
 * de política de API.
 */

/**
 * Número no formato que o wa.me aceita: só dígitos, com código do país.
 *
 * Número brasileiro digitado sem o 55 (10 ou 11 dígitos, com DDD) ganha o 55.
 * Qualquer outra coisa curta demais para ser telefone devolve `null` — um
 * link para número inválido abriria uma conversa que não chega em ninguém.
 */
export function normalizeWhatsappNumber(phone) {
  const digitos = String(phone ?? '').replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if (digitos.length >= 12 && digitos.length <= 15) return digitos;
  return null;
}

/** Link wa.me com a mensagem pronta, ou `null` sem número utilizável. */
export function whatsappLink(phone, message = '') {
  const numero = normalizeWhatsappNumber(phone);
  if (!numero) return null;
  const texto = String(message ?? '').trim();
  return texto
    ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/${numero}`;
}

/**
 * Telefone legível para exibir: "(11) 98765-4321".
 *
 * Aceita com ou sem o 55. Formato que não reconhece volta como veio — melhor
 * mostrar os dígitos crus do que esconder o número de quem precisa ligar.
 */
export function formatPhone(phone) {
  const digitos = String(phone ?? '').replace(/\D/g, '');
  const local =
    digitos.length >= 12 && digitos.startsWith('55')
      ? digitos.slice(2)
      : digitos;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return String(phone ?? '');
}

/** Link `tel:` com código do país, ou `null` sem número utilizável. */
export function telLink(phone) {
  const numero = normalizeWhatsappNumber(phone);
  return numero ? `tel:+${numero}` : null;
}
