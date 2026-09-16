import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  // Caminho relativo (e não o alias `@/`): este módulo é exercitado por
  // `node --test`, que não resolve os aliases do bundler.
} from '../../lib/auth/password-rules.js';

/**
 * Hash de senha dos usuários do painel.
 *
 * Usa scrypt do próprio Node: é KDF de memória dura, recomendada para senhas, e
 * evita uma dependência nativa (bcrypt/argon2) que precisaria ser compilada em
 * cada implantação. Os parâmetros viajam dentro do hash, então aumentar o custo
 * no futuro não invalida as senhas já gravadas — cada hash é verificado com os
 * parâmetros com que foi criado.
 */

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'scrypt';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
/** Custo atual. `N` precisa ser potência de 2; 2^15 fica na casa dos 100ms. */
const COST = { N: 32_768, r: 8, p: 1 };
/** maxmem padrão do Node (32MB) não cobre N=32768; 128*N*r deixa folga. */
const MAX_MEM = 128 * COST.N * COST.r * 2;

// Os números vêm do módulo compartilhado com o formulário: uma política só.
const MIN_PASSWORD_LENGTH = PASSWORD_MIN_LENGTH;
const MAX_PASSWORD_LENGTH = PASSWORD_MAX_LENGTH;

export { PASSWORD_RULES };

/** Gera o hash de uma senha em texto claro. */
export async function hashPassword(password) {
  assertUsablePassword(password);

  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(
    password.normalize('NFKC'),
    salt,
    KEY_LENGTH,
    {
      ...COST,
      maxmem: MAX_MEM,
    },
  );

  return [
    ALGORITHM,
    COST.N,
    COST.r,
    COST.p,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

/**
 * Confere uma senha contra um hash.
 *
 * Nunca lança por entrada inválida: hash corrompido ou senha fora das regras
 * devolve `false`, porque quem chama é o login e a resposta dele é sempre a
 * mesma independentemente do motivo.
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [, rawN, rawR, rawP, rawSalt, rawHash] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  const salt = Buffer.from(rawSalt, 'base64url');
  const expected = Buffer.from(rawHash, 'base64url');
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const derived = await scryptAsync(
      password.normalize('NFKC'),
      salt,
      expected.length,
      { N, r, p, maxmem: 128 * N * r * 2 },
    );
    return timingSafeEqual(derived, expected);
  } catch {
    // Parâmetros absurdos no hash gravado (N fora de faixa, maxmem estourado).
    return false;
  }
}

/** Erro de política de senha, com código estável para a rota traduzir. */
export class PasswordPolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PasswordPolicyError';
    this.code = 'weak_password';
  }
}

function assertUsablePassword(password) {
  if (typeof password !== 'string') {
    throw new PasswordPolicyError('Senha inválida.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordPolicyError(
      `A senha precisa de ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordPolicyError(
      `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`,
    );
  }
}
