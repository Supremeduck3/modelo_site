import { getSectionContent, siteConfig } from '@/config/site';
import AboutSection from './about/AboutSection';
import ContactSection from './contact/ContactSection';
import DifferentialsSection from './differentials/DifferentialsSection';
import FaqSection from './faq/FaqSection';
import GallerySection from './gallery/GallerySection';
import HeroSection from './hero/HeroSection';
import ServicesSection from './services/ServicesSection';
import SubmissionSection from './submission/SubmissionSection';
import TeamSection from './team/TeamSection';
import TestimonialsSection from './testimonials/TestimonialsSection';

/**
 * Registro de seções do molde. Adicionar uma seção nova é registrar um tipo
 * aqui e declarar suas variantes em src/config/site/schema.js — páginas não mudam.
 */
const SECTION_COMPONENTS = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  differentials: DifferentialsSection,
  gallery: GallerySection,
  testimonials: TestimonialsSection,
  team: TeamSection,
  faq: FaqSection,
  contact: ContactSection,
  submission: SubmissionSection,
};

/**
 * Mídia declarada em `media.<seção>` entra como `image`/`items` da seção,
 * para que o bloco `media` da configuração não seja decorativo.
 */
function resolveMedia(type) {
  const media = siteConfig.media?.[type];
  if (!media) return {};
  return Array.isArray(media) ? { items: media } : { image: media };
}

/**
 * Renderiza a lista de seções declarada na configuração, na ordem configurada.
 * A ordem da home é dado, não código.
 */
export default function SectionRenderer({ sections }) {
  return sections.map((section, index) => {
    const Component = SECTION_COMPONENTS[section.type];
    if (!Component) return null;

    return (
      <Component
        key={section.id ?? `${section.type}-${index}`}
        id={section.id ?? section.type}
        variant={section.variant}
        content={{
          // Precedência: mídia global da implantação < conteúdo da seção <
          // conteúdo declarado na própria entrada de pages.home.sections.
          ...resolveMedia(section.type),
          ...getSectionContent(section.type),
          ...(section.content ?? {}),
        }}
      />
    );
  });
}
