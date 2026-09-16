/**
 * Monta o link de ativação de um convite.
 *
 * Fica em módulo próprio porque dois lugares precisam do mesmo formato: o
 * e-mail e o link copiável que a rota devolve ao admin. Sem `NEXT_PUBLIC_SITE_URL`
 * o link sai relativo — ainda serve para copiar e colar no mesmo navegador.
 */
export function buildInviteLink(token) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ?? '';
  return `${base}/painel/convite?token=${encodeURIComponent(token)}`;
}
