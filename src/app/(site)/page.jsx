import SectionRenderer from '@/components/sections/SectionRenderer';
import { getHomeSections, siteConfig } from '@/config/site';

/**
 * Home institucional. A página não conhece seções específicas: ela apenas
 * entrega ao renderer o que a configuração da implantação declarou.
 */
export default function HomePage() {
  const sections = getHomeSections();
  const { identity, contact, seo } = siteConfig;

  const localBusiness = seo.localBusiness
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: identity.name,
        description: seo.description ?? identity.description,
        telephone: contact.phone || undefined,
        email: contact.email || undefined,
        url: seo.siteUrl || undefined,
        address: contact.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: contact.address,
              addressLocality: contact.city || undefined,
              addressRegion: contact.state || undefined,
            }
          : undefined,
      }
    : null;

  return (
    <>
      {localBusiness && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD gerado a partir da configuração local, sem entrada de usuário.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusiness),
          }}
        />
      )}
      <SectionRenderer sections={sections} />
    </>
  );
}
