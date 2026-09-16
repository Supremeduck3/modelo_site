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
 * Seções da home já filtradas pelas feature flags.
 * Uma seção desligada por flag não deve chegar ao renderer.
 */
export function getHomeSections() {
  return config.pages.home.sections.filter((section) => {
    const flag = features[section.type];
    return flag === undefined || flag === true;
  });
}

/** Conteúdo de uma seção, sempre um objeto. */
export function getSectionContent(type) {
  return config.content?.[type] ?? {};
}

export { SECTION_VARIANTS };
