/**
 * URL base pública da implantação, normalizada.
 *
 * Fica num módulo só porque `robots` e `sitemap` precisam exatamente da mesma
 * forma — com a barra final removida — e duas normalizações acabariam
 * divergindo.
 */
export function publicBaseUrl(siteUrl) {
  const base = siteUrl?.trim().replace(/\/+$/, '');
  return base || null;
}
