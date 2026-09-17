import { features, siteConfig } from '@/config/site';
import { publicBaseUrl } from '@/config/site/base-url';

/**
 * robots.txt gerado da configuração da implantação.
 *
 * O painel e a API nunca entram em buscador — isso não pode depender de alguém
 * lembrar.
 *
 * Em homologação (`seo.noindex`) o rastreio continua **liberado** de propósito.
 * Parece contraintuitivo, mas é o único jeito de sair do índice: quem bloqueia
 * com `Disallow` impede o robô de buscar a página e, com isso, de ler a marca
 * `noindex` que manda removê-la. Uma URL de teste já indexada, ou linkada de
 * fora, ficaria no índice para sempre. Deixamos o robô entrar justamente para
 * que ele leia o `noindex` e vá embora.
 */
export default function robots() {
  const base = publicBaseUrl(siteConfig.seo.siteUrl);

  const disallow = ['/painel', '/api'];
  if (!features.submissions) disallow.push('/manifestacao');

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    // Em homologação não anunciamos sitemap: não há o que oferecer ao índice.
    // Sem domínio configurado também não, porque a URL precisa ser absoluta.
    sitemap:
      base && !siteConfig.seo.noindex ? `${base}/sitemap.xml` : undefined,
  };
}
