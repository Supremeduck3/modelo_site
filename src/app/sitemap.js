import { features, siteConfig } from '@/config/site';
import { publicBaseUrl } from '@/config/site/base-url';

/**
 * sitemap.xml gerado da configuração.
 *
 * Lista só o que é público e existe nesta implantação: o canal de
 * manifestações entra apenas quando o bloco está ativo, e as páginas legais
 * apenas quando têm texto — apontar o buscador para uma página que só diz
 * "texto não preenchido" é pior do que não listá-la.
 */
export default function sitemap() {
  const base = publicBaseUrl(siteConfig.seo.siteUrl);

  // Sem domínio configurado o sitemap não tem como ser útil: as URLs precisam
  // ser absolutas.
  if (!base || siteConfig.seo.noindex) return [];

  const now = new Date();

  const rotas = [
    { path: '', priority: 1 },
    features.submissions ? { path: '/manifestacao', priority: 0.8 } : null,
    siteConfig.legal.privacyPolicy
      ? { path: '/privacidade', priority: 0.3 }
      : null,
    siteConfig.legal.terms ? { path: '/termos', priority: 0.3 } : null,
  ].filter(Boolean);

  return rotas.map((rota) => ({
    url: `${base}${rota.path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: rota.priority,
  }));
}
