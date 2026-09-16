/**
 * Política de senha do painel.
 *
 * Fica num módulo compartilhado porque o formulário (navegador) e o hash
 * (servidor) precisam do mesmo número. Se cada lado tivesse o seu, um dia o
 * formulário aceitaria uma senha que o servidor recusa.
 */

/** Comprimento protege mais que regra de símbolo: exigimos tamanho, não sopa. */
export const PASSWORD_MIN_LENGTH = 10;

/**
 * Limite de entrada: scrypt não trunca como o bcrypt, mas aceitar texto
 * gigante transformaria a troca de senha em vetor de consumo de CPU.
 */
export const PASSWORD_MAX_LENGTH = 200;

export const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
};
