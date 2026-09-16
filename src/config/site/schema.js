/**
 * Schema declarativo da configuração de implantação.
 *
 * O molde é "configuração + dados + componentes". Este arquivo define a forma
 * esperada da configuração, os valores padrão e a validação em runtime.
 * Nenhum dado específico de cliente deve morar aqui — apenas fallbacks seguros.
 */

/** Variantes de navegação suportadas pelo motor visual. */
export const NAVIGATION_VARIANTS = ['header', 'header-compact', 'sidebar'];

/** Comportamentos de navegação suportados. */
export const NAVIGATION_BEHAVIORS = ['fixed', 'static', 'shrink-on-scroll'];

/** Posições suportadas para a navegação. */
export const NAVIGATION_POSITIONS = ['top', 'left', 'right'];

/** Seções da home e as variantes visuais disponíveis para cada uma. */
export const SECTION_VARIANTS = {
  hero: ['full-image', 'split', 'centered', 'cta-focus'],
  about: ['simple', 'image-text', 'stats'],
  services: ['cards', 'list', 'grid', 'image-text'],
  differentials: ['icons', 'cards', 'side-blocks'],
  gallery: ['grid', 'masonry', 'carousel'],
  testimonials: ['cards', 'slider', 'single'],
  team: ['cards', 'list', 'highlight'],
  faq: ['accordion', 'blocks', 'two-columns'],
  contact: ['cards', 'map', 'form-split'],
  submission: ['cta', 'embedded'],
};

/** Configuração mínima viável, usada como fallback de cada campo ausente. */
export const DEFAULT_CONFIG = {
  identity: {
    name: 'Sua Empresa',
    shortName: '',
    tagline: '',
    description: '',
    logo: null,
    logoDark: null,
    favicon: '/favicon.ico',
    segment: '',
  },
  contact: {
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    mapEmbedUrl: '',
    businessHours: [],
    socials: [],
  },
  navigation: {
    variant: 'header',
    position: 'top',
    behavior: 'fixed',
    mobile: 'drawer',
    showCta: true,
    ctaLabel: 'Enviar manifestação',
    ctaHref: '/manifestacao',
    items: [{ label: 'Início', href: '/' }],
  },
  theme: {
    colors: {
      primary: '#1f6feb',
      primaryContrast: '#ffffff',
      secondary: '#0b3a7a',
      accent: '#f0a202',
      background: '#ffffff',
      surface: '#f5f7fa',
      surfaceAlt: '#eef2f7',
      border: '#dde3ec',
      text: '#16202e',
      textMuted: '#5b6982',
      success: '#1f9254',
      danger: '#c62828',
    },
    typography: {
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      headingFamily: null,
      baseSize: '16px',
      headingWeight: 700,
      bodyWeight: 400,
      lineHeight: 1.6,
    },
    shape: {
      radius: '12px',
      radiusSmall: '8px',
      radiusLarge: '24px',
      borderWidth: '1px',
    },
    spacing: {
      sectionY: '80px',
      sectionYMobile: '48px',
      containerWidth: '1160px',
      gap: '24px',
    },
    shadows: {
      soft: '0 2px 8px rgba(16, 24, 40, 0.06)',
      medium: '0 8px 24px rgba(16, 24, 40, 0.1)',
    },
    buttons: { style: 'solid' },
  },
  media: {
    hero: null,
    about: null,
    gallery: [],
    placeholder: null,
  },
  content: {
    hero: {},
    about: {},
    services: { items: [] },
    differentials: { items: [] },
    gallery: { items: [] },
    testimonials: { items: [] },
    team: { items: [] },
    faq: { items: [] },
    contact: {},
    submission: {},
  },
  pages: {
    home: { sections: [{ type: 'hero', variant: 'split' }] },
  },
  features: {
    submissions: true,
    gallery: false,
    testimonials: false,
    team: false,
    faq: false,
    newsletter: false,
  },
  seo: {
    title: null,
    description: null,
    keywords: [],
    openGraphImage: null,
    locale: 'pt_BR',
    siteUrl: '',
    localBusiness: false,
  },
  legal: {
    privacyPolicy: '',
    terms: '',
    companyRegistration: '',
  },
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Mescla profundamente a configuração da implantação sobre os padrões. */
function mergeDeep(base, override) {
  if (!isPlainObject(override)) return base;
  const result = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    result[key] =
      isPlainObject(value) && isPlainObject(base?.[key])
        ? mergeDeep(base[key], value)
        : value;
  }
  return result;
}

/**
 * Valida a configuração e devolve { config, errors, warnings }.
 * Erros de digitação em variantes viram warning + fallback, nunca tela branca.
 */
export function validateSiteConfig(rawConfig) {
  const errors = [];
  const warnings = [];
  const config = mergeDeep(DEFAULT_CONFIG, rawConfig ?? {});

  if (!config.identity.name?.trim()) {
    errors.push('identity.name é obrigatório.');
  }

  const nav = config.navigation;
  if (!NAVIGATION_VARIANTS.includes(nav.variant)) {
    warnings.push(
      `navigation.variant "${nav.variant}" desconhecida; usando "header".`,
    );
    nav.variant = 'header';
  }
  if (!NAVIGATION_POSITIONS.includes(nav.position)) {
    warnings.push(
      `navigation.position "${nav.position}" desconhecida; usando "top".`,
    );
    nav.position = 'top';
  }
  if (!NAVIGATION_BEHAVIORS.includes(nav.behavior)) {
    warnings.push(
      `navigation.behavior "${nav.behavior}" desconhecido; usando "fixed".`,
    );
    nav.behavior = 'fixed';
  }
  if (nav.variant === 'sidebar' && nav.position === 'top') {
    nav.position = 'left';
  }
  if (nav.variant !== 'sidebar' && nav.position !== 'top') {
    nav.position = 'top';
  }
  if (!Array.isArray(nav.items) || nav.items.length === 0) {
    errors.push('navigation.items precisa de ao menos um item.');
    nav.items = DEFAULT_CONFIG.navigation.items;
  }

  const sections = config.pages?.home?.sections;
  if (!Array.isArray(sections) || sections.length === 0) {
    errors.push('pages.home.sections precisa de ao menos uma seção.');
    config.pages.home.sections = DEFAULT_CONFIG.pages.home.sections;
  } else {
    config.pages.home.sections = sections.filter((section) => {
      const allowed = SECTION_VARIANTS[section?.type];
      if (!allowed) {
        warnings.push(
          `Seção "${section?.type}" não existe no molde; ignorada.`,
        );
        return false;
      }
      if (!allowed.includes(section.variant)) {
        warnings.push(
          `Variante "${section.variant}" inválida para "${section.type}"; usando "${allowed[0]}".`,
        );
        section.variant = allowed[0];
      }
      return true;
    });
  }

  return { config, errors, warnings };
}
