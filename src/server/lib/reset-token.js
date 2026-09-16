import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Token do link de recuperação de senha.
 *
 * O valor em claro existe só no link enviado por e-mail; o banco guarda o hash.
 * Quem lê a tabela `password_resets` — num dump, num backup, numa consulta de
 * suporte — não consegue redefinir a senha de ninguém.
 *
 * SHA-256 sem sal e sem custo é adequado aqui, ao contrário de senha: o token
 * já nasce com 256 bits de aleatoriedade, então não há dicionário a percorrer.
 */

const TOKEN_BYTES = 32;

/** Token novo, seguro para ir numa URL. */
export function generateResetToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** Hash do token, no formato em que é gravado e consultado. */
export function hashResetToken(token) {
  return createHash('sha256')
    .update(String(token ?? ''))
    .digest('hex');
}

/** Comparação em tempo constante entre dois hashes hexadecimais. */
export function resetTokensMatch(hashA, hashB) {
  const a = Buffer.from(String(hashA ?? ''), 'hex');
  const b = Buffer.from(String(hashB ?? ''), 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
