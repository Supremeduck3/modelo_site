import { siteConfig } from '@/config/site';

const CSS_VAR_MAP = {
  colors: {
    primary: '--color-primary',
    primaryContrast: '--color-primary-contrast',
    secondary: '--color-secondary',
    accent: '--color-accent',
    background: '--color-background',
    surface: '--color-surface',
    surfaceAlt: '--color-surface-alt',
    border: '--color-border',
    text: '--color-text',
    textMuted: '--color-text-muted',
    success: '--color-success',
    danger: '--color-danger',
  },
  typography: {
    fontFamily: '--font-family',
    headingFamily: '--font-family-heading',
    baseSize: '--font-size-base',
    headingWeight: '--font-weight-heading',
    bodyWeight: '--font-weight-body',
    lineHeight: '--line-height-base',
  },
  shape: {
    radius: '--radius',
    radiusSmall: '--radius-sm',
    radiusLarge: '--radius-lg',
    borderWidth: '--border-width',
  },
  spacing: {
    sectionY: '--section-y',
    sectionYMobile: '--section-y-mobile',
    containerWidth: '--container-width',
    gap: '--gap',
  },
  shadows: {
    soft: '--shadow-soft',
    medium: '--shadow-medium',
  },
};

/**
 * Converte os tokens de tema da implantação em variáveis CSS.
 * É o único ponto onde o tema vira estilo — componentes só consomem as vars.
 */
export function buildThemeVariables(theme = siteConfig.theme) {
  const vars = {};
  for (const [group, keys] of Object.entries(CSS_VAR_MAP)) {
    for (const [key, cssVar] of Object.entries(keys)) {
      const value = theme?.[group]?.[key];
      if (value !== null && value !== undefined && value !== '') {
        vars[cssVar] = String(value);
      }
    }
  }
  if (!vars['--font-family-heading'] && vars['--font-family']) {
    vars['--font-family-heading'] = vars['--font-family'];
  }
  return vars;
}
