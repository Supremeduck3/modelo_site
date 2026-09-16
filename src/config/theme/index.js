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

/** Bloco `:root { ... }` pronto para ser injetado no <head>. */
export function buildThemeStyleSheet(theme = siteConfig.theme) {
  const declarations = Object.entries(buildThemeVariables(theme))
    .map(([name, value]) => `${name}: ${value};`)
    .join('\n    ');
  return `:root {\n    ${declarations}\n}`;
}

/** Mapeia os tokens do molde para o ConfigProvider do Ant Design. */
export function buildAntdTheme(theme = siteConfig.theme) {
  const { colors, typography, shape } = theme;
  return {
    token: {
      colorPrimary: colors.primary,
      colorText: colors.text,
      colorTextSecondary: colors.textMuted,
      colorBgBase: colors.background,
      colorBorder: colors.border,
      colorSuccess: colors.success,
      colorError: colors.danger,
      borderRadius: Number.parseInt(shape.radius, 10) || 8,
      fontFamily: typography.fontFamily,
    },
  };
}
