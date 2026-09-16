/**
 * Identifica o cliente de uma requisição para fins de rate limiting.
 *
 * Atrás de proxy/CDN o IP real chega em cabeçalho. Não é identidade confiável
 * — serve apenas para limitar abuso, nunca para autorização.
 */
export function getClientIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'desconhecido';
}
