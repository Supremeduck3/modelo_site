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
    displayScale: '--display-scale',
    headingTracking: '--heading-tracking',
    headingTransform: '--heading-transform',
    headingLineHeight: '--heading-line-height',
    eyebrowTracking: '--eyebrow-tracking',
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
    gapLarge: '--gap-lg',
    measure: '--measure',
  },
  shadows: {
    soft: '--shadow-soft',
    medium: '--shadow-medium',
  },
  buttons: {
    radius: '--button-radius',
    padding: '--button-padding',
    weight: '--button-weight',
    tracking: '--button-tracking',
    transform: '--button-transform',
  },
  images: {
    ratio: '--image-ratio',
    radius: '--image-radius',
    filter: '--image-filter',
    hoverFilter: '--image-hover-filter',
  },
  motion: {
    duration: '--motion-duration',
    easing: '--motion-easing',
    revealShift: '--reveal-shift',
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

/** Aceita apenas medidas em px, porque os tokens do antd são numéricos. */
function pxToNumber(value) {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(String(value ?? '').trim());
  return match ? Number(match[1]) : undefined;
}

/**
 * Converte os mesmos tokens da implantação no tema do Ant Design, usado só pelo
 * painel.
 *
 * O painel não repete as cores em outro lugar: cliente com marca verde tem
 * painel verde sem ninguém editar nada além da configuração. O que o antd
 * espera em número (raio, corpo da fonte) é convertido aqui; valor em outra
 * unidade é ignorado e o antd fica com o próprio padrão.
 */
export function buildAntdTheme(theme = siteConfig.theme) {
  const { colors = {}, typography = {}, shape = {} } = theme ?? {};

  const token = {
    colorPrimary: colors.primary,
    colorInfo: colors.primary,
    colorSuccess: colors.success,
    colorError: colors.danger,
    colorLink: colors.primary,
    colorTextBase: colors.text,
    colorBgBase: colors.background,
    fontFamily: typography.fontFamily,
    borderRadius: pxToNumber(shape.radius),
    fontSize: pxToNumber(typography.baseSize),
    /*
     * Cinzas de texto secundário, com contraste conferido.
     *
     * O padrão do antd para placeholder e campo desabilitado fica em torno de
     * 1,7:1 sobre branco, longe do mínimo de 4,5:1 do WCAG AA — e o painel é
     * ferramenta de trabalho, usada o dia inteiro. Usamos o cinza de texto
     * secundário da própria implantação, que já é validado para o site
     * público.
     */
    colorTextPlaceholder: colors.textMuted,
    colorTextDisabled: colors.textMuted,
    colorTextDescription: colors.textMuted,
    wireframe: false,
  };

  /*
   * O fundo do cabeçalho e do corpo do Layout vem por token, não por CSS
   * Module: o antd escreve `.ant-layout-header { background }` com a mesma
   * especificidade da nossa classe e é injetado depois, então venceria a
   * regra local — o cabeçalho ficava escuro com texto escuro. Pelo token,
   * quem decide continua sendo a configuração da implantação.
   */
  const components = {
    Layout: {
      headerBg: colors.background,
      bodyBg: colors.surface,
    },
  };

  // O antd trata `undefined` como "não definido", mas só se a chave não vier
  // com valor vazio; limpamos para o padrão dele valer de fato.
  for (const [key, value] of Object.entries(token)) {
    if (value === undefined || value === null || value === '') {
      delete token[key];
    }
  }
  for (const [key, value] of Object.entries(components.Layout)) {
    if (value === undefined || value === null || value === '') {
      delete components.Layout[key];
    }
  }

  return { token, components };
}
