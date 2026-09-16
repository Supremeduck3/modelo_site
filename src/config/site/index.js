import { SECTION_VARIANTS, validateSiteConfig } from './schema.js';
import rawSiteConfig from './site.config.js';

const { config, errors, warnings } = validateSiteConfig(rawSiteConfig);

if (process.env.NODE_ENV !== 'production') {
  for (const warning of warnings) {
    console.warn(`[site-config] ${warning}`);
  }
}

if (errors.length > 0) {
  throw new Error(
    `Configuração da implantação inválida:\n- ${errors.join('\n- ')}`,
  );
}

/** Configuração validada e completa desta implantação. */
export const siteConfig = config;

/** Mapa de feature flags da implantação. */
export const features = config.features;

/**
 * Nem toda seção tem o mesmo nome da flag que a controla.
 * Este mapa evita que uma flag deixe de ter efeito por divergência de nome.
 */
const SECTION_FEATURE_FLAG = {
  submission: 'submissions',
};

/**
 * Seções da home já filtradas pelas feature flags.
 * Uma seção desligada por flag não deve chegar ao renderer; desligar por
 * engano é um erro comum de implantação, então avisamos em desenvolvimento.
 */
export function getHomeSections() {
  return config.pages.home.sections.filter((section) => {
    const flagName = SECTION_FEATURE_FLAG[section.type] ?? section.type;
    const flag = features[flagName];

    if (flag === false && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[site-config] Seção "${section.type}" está declarada na home, mas features.${flagName} é false; ela não será renderizada.`,
      );
    }

    return flag === undefined || flag === true;
  });
}

/** Conteúdo de uma seção, sempre um objeto. */
export function getSectionContent(type) {
  return config.content?.[type] ?? {};
}

export { SECTION_VARIANTS };
