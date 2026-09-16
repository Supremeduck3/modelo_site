import { randomInt } from 'node:crypto';

/**
 * Alfabeto sem caracteres ambíguos (0/O, 1/I), para o protocolo ser ditado por
 * telefone sem erro.
 */
const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY2346789';
const BLOCK_SIZE = 4;
const BLOCKS = 2;

/**
 * Gera um protocolo público no formato AAAA-XXXX-XXXX.
 *
 * O ano ajuda o atendimento a situar a manifestação, mas a parte identificadora
 * é aleatória: a especificação exige que o protocolo não seja previsível por
 * sequência simples exposta publicamente.
 */
export function generateProtocol(now = new Date()) {
  const blocks = Array.from({ length: BLOCKS }, () =>
    Array.from(
      { length: BLOCK_SIZE },
      () => ALPHABET[randomInt(ALPHABET.length)],
    ).join(''),
  );

  return [now.getFullYear(), ...blocks].join('-');
}

const PROTOCOL_PATTERN = new RegExp(
  `^\\d{4}(-[${ALPHABET}]{${BLOCK_SIZE}}){${BLOCKS}}$`,
);

/** Valida o formato de um protocolo informado pelo visitante. */
export function isValidProtocol(value) {
  return typeof value === 'string' && PROTOCOL_PATTERN.test(value.trim());
}

/** Normaliza o que o visitante digitou (espaços, minúsculas). */
export function normalizeProtocol(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}
