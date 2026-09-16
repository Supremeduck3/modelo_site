/**
 * Nome do cookie de sessão do painel.
 *
 * Em módulo próprio porque o middleware roda no runtime edge e não pode
 * importar o módulo de sessão, que depende de `next/headers` e do Prisma.
 */
export const SESSION_COOKIE = 'painel_session';
