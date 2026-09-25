/**
 * DIREÇÕES DE ARTE DO MOLDE.
 *
 * Um preset é apenas um tema parcial com nome. Ele responde à pergunta
 * "que cara esse cliente tem?" antes de a implantação decidir cor e texto —
 * é o que faz dois clientes com as mesmas seções não parecerem o mesmo site.
 *
 * Precedência: DEFAULT_CONFIG.theme < preset < theme declarado na implantação.
 * Por isso um preset pode ser adotado inteiro (`theme.preset: 'editorial'`) ou
 * adotado e corrigido em um ponto só (preset + `colors.primary` próprio).
 *
 * Nenhum componente conhece preset: tudo vira variável CSS em config/theme.
 */

/*
 * As famílias vêm de `config/theme/fonts.js`, servidas pelo próprio domínio, e
 * chegam aqui como variável CSS. `fontImport` continua existindo para a
 * implantação que quiser apontar uma folha externa própria, mas nenhum preset
 * do molde usa: fonte de terceiro no caminho crítico custava ~300 ms no maior
 * elemento da dobra.
 */

/**
 * Padrão do molde: neutro, legível, sem personalidade forte.
 * É o preset de quem ainda não decidiu a direção de arte.
 */
const padrao = {
  typography: {
    fontImport: null,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    headingFamily: null,
    displayScale: 1,
    headingTracking: '-0.02em',
    headingTransform: 'none',
    headingLineHeight: 1.15,
    eyebrowTracking: '0.1em',
  },
  shape: { radius: '12px', radiusSmall: '8px', radiusLarge: '24px' },
  spacing: {
    sectionY: '96px',
    sectionYMobile: '56px',
    containerWidth: '1160px',
    gap: '24px',
    gapLarge: '64px',
    measure: '62ch',
  },
  buttons: {
    style: 'solid',
    radius: 'var(--radius-sm)',
    padding: '0.9em 1.7em',
    weight: 600,
    tracking: '0',
    transform: 'none',
  },
  images: {
    ratio: '4 / 3',
    radius: 'var(--radius)',
    filter: 'none',
    hoverFilter: 'none',
  },
  motion: {
    duration: '520ms',
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    revealShift: '18px',
  },
};

/**
 * Registro: a direção de arte de referência do molde.
 *
 * Parte do que o produto tem de mais próprio — o canal de manifestações e o
 * protocolo — e leva essa linguagem de "registro bem feito" para o site todo:
 * papel quente em vez de branco de tela, tinta quase preta, uma cor de marca
 * profunda (petróleo) e o cobre só como marca gráfica, nunca como texto
 * pequeno (4,15:1 sobre o papel). Separação por filete e espaço, não por
 * caixa com sombra. Dados (protocolo, horário, data, contagem) em monoespaçada
 * com algarismos tabulares: é o detalhe que liga site, canal e painel.
 *
 * Serve para serviços locais, clínicas, escritórios e comércio de bairro —
 * quem precisa parecer organizado e confiável antes de parecer "moderno".
 */
const registro = {
  colors: {
    primary: '#0e4a45',
    primaryContrast: '#f6f4ee',
    secondary: '#14201c',
    accent: '#b45f24',
    background: '#f6f4ee',
    surface: '#eeebe2',
    surfaceAlt: '#e4e0d4',
    border: '#d3cdbd',
    borderStrong: '#8a8578',
    text: '#171a17',
    textMuted: '#575b53',
    success: '#1c6b3c',
    danger: '#b3261e',
    warning: '#8a5000',
  },
  typography: {
    fontImport: null,
    fontFamily: 'var(--font-schibsted), system-ui, sans-serif',
    headingFamily: 'var(--font-schibsted), system-ui, sans-serif',
    monoFamily: 'var(--font-plex-mono), ui-monospace, Menlo, monospace',
    headingWeight: 650,
    displayScale: 1.12,
    headingTracking: '-0.028em',
    headingTransform: 'none',
    headingLineHeight: 1.04,
    eyebrowTracking: '0.16em',
    lineHeight: 1.6,
  },
  /*
   * Raio pequeno e deliberado: 2px em superfície, 6px em controle. Canto
   * arredondado em tudo é o que faz um site parecer tema pronto.
   */
  shape: {
    radius: '6px',
    radiusSmall: '4px',
    radiusLarge: '10px',
    borderWidth: '1px',
  },
  spacing: {
    sectionY: '128px',
    sectionYMobile: '64px',
    containerWidth: '1200px',
    gap: '24px',
    gapLarge: '80px',
    measure: '60ch',
  },
  // Uma sombra só, para o que flutua (menu aberto, modal). Nada de card elevado.
  shadows: {
    soft: 'none',
    medium:
      '0 1px 2px rgba(23, 26, 23, 0.06), 0 18px 40px -24px rgba(23, 26, 23, 0.35)',
  },
  buttons: {
    style: 'solid',
    radius: '4px',
    padding: '0.95em 1.6em',
    weight: 600,
    tracking: '0',
    transform: 'none',
  },
  images: {
    ratio: '4 / 5',
    radius: '2px',
    filter: 'none',
    hoverFilter: 'none',
  },
  motion: {
    duration: '480ms',
    easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
    revealShift: '14px',
  },
};

/**
 * Editorial: escritórios, consultorias, clínicas, advocacia.
 * Serifada de display, muito espaço negativo, nada de raio nem sombra —
 * a hierarquia vem do tamanho e do respiro, não de caixas.
 */
const editorial = {
  colors: {
    primary: '#8a4b2a',
    primaryContrast: '#f8f5ef',
    secondary: '#15130f',
    accent: '#b98c4d',
    background: '#f8f5ef',
    surface: '#efe9dd',
    surfaceAlt: '#e6dece',
    border: '#d8cfbd',
    borderStrong: '#8f846f',
    text: '#15130f',
    textMuted: '#6b6152',
  },
  typography: {
    fontImport: null,
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    headingFamily: "var(--font-fraunces), Georgia, 'Times New Roman', serif",
    headingWeight: 400,
    displayScale: 1.22,
    headingTracking: '-0.015em',
    headingTransform: 'none',
    headingLineHeight: 1.02,
    eyebrowTracking: '0.24em',
    lineHeight: 1.7,
  },
  shape: {
    radius: '0px',
    radiusSmall: '0px',
    radiusLarge: '0px',
    borderWidth: '1px',
  },
  spacing: {
    sectionY: '148px',
    sectionYMobile: '72px',
    containerWidth: '1200px',
    gap: '32px',
    gapLarge: '96px',
    measure: '58ch',
  },
  shadows: { soft: 'none', medium: 'none' },
  buttons: {
    style: 'square',
    radius: '0px',
    padding: '1.05em 2.2em',
    weight: 500,
    tracking: '0.08em',
    transform: 'uppercase',
  },
  images: {
    ratio: '3 / 4',
    radius: '0px',
    filter: 'grayscale(0.3) contrast(1.03)',
    hoverFilter: 'grayscale(0) contrast(1.05)',
  },
  motion: {
    duration: '760ms',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    revealShift: '26px',
  },
};

/**
 * Expressivo: restaurantes, hospitalidade, marcas que vivem de imagem.
 * Fundo escuro, display condensada em caixa alta, imagem grande e botão pílula.
 */
const expressivo = {
  colors: {
    primary: '#e2552b',
    primaryContrast: '#120e0c',
    secondary: '#f4ece1',
    accent: '#e8b04b',
    background: '#120e0c',
    surface: '#1c1613',
    surfaceAlt: '#261e19',
    border: '#3a2f27',
    borderStrong: '#7a6b5f',
    text: '#f4ece1',
    textMuted: '#a2958a',
    // Fundo escuro: os estados padrão (escuros) sumiriam; estes medem >6:1.
    success: '#4cb782',
    danger: '#ef6a5a',
    warning: '#e8b04b',
  },
  typography: {
    fontImport: null,
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    headingFamily: 'var(--font-archivo), var(--font-inter), sans-serif',
    headingWeight: 800,
    displayScale: 1.32,
    headingTracking: '-0.03em',
    headingTransform: 'uppercase',
    headingLineHeight: 0.94,
    eyebrowTracking: '0.28em',
    lineHeight: 1.6,
  },
  shape: {
    radius: '4px',
    radiusSmall: '4px',
    radiusLarge: '8px',
    borderWidth: '1px',
  },
  spacing: {
    sectionY: '120px',
    sectionYMobile: '64px',
    containerWidth: '1320px',
    gap: '24px',
    gapLarge: '72px',
    measure: '54ch',
  },
  shadows: { soft: 'none', medium: '0 30px 70px -40px rgba(0, 0, 0, 0.85)' },
  buttons: {
    style: 'pill',
    radius: '999px',
    padding: '1.05em 2.1em',
    weight: 700,
    tracking: '0.06em',
    transform: 'uppercase',
  },
  images: {
    ratio: '1 / 1',
    radius: '4px',
    filter: 'saturate(1.06) contrast(1.06)',
    hoverFilter: 'saturate(1.18) contrast(1.1)',
  },
  motion: {
    duration: '520ms',
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    revealShift: '30px',
  },
};

/**
 * Comercial: lojas, catálogos, produtos.
 * Claro, denso e objetivo — cartões com elevação, raio generoso e leitura rápida.
 */
const comercial = {
  colors: {
    /*
     * Framboesa, não azul: azul/roxo era a cor "automática" de qualquer
     * template SaaS. 7,27:1 com texto branco.
     */
    primary: '#a3214f',
    primaryContrast: '#ffffff',
    secondary: '#0c1424',
    accent: '#f2a93b',
    background: '#ffffff',
    surface: '#f3f5f9',
    surfaceAlt: '#e9edf5',
    border: '#dfe4ee',
    borderStrong: '#7d8699',
    text: '#0c1424',
    textMuted: '#5c6b84',
  },
  typography: {
    fontImport: null,
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    headingFamily: 'var(--font-space-grotesk), var(--font-inter), sans-serif',
    headingWeight: 700,
    displayScale: 1,
    headingTracking: '-0.035em',
    headingTransform: 'none',
    headingLineHeight: 1.06,
    eyebrowTracking: '0.14em',
    lineHeight: 1.6,
  },
  shape: {
    radius: '14px',
    radiusSmall: '10px',
    radiusLarge: '22px',
    borderWidth: '1px',
  },
  spacing: {
    sectionY: '104px',
    sectionYMobile: '56px',
    containerWidth: '1200px',
    gap: '20px',
    gapLarge: '56px',
    measure: '60ch',
  },
  shadows: {
    soft: '0 1px 2px rgba(12, 20, 36, 0.05), 0 10px 26px -18px rgba(12, 20, 36, 0.35)',
    medium:
      '0 2px 4px rgba(12, 20, 36, 0.06), 0 26px 54px -24px rgba(12, 20, 36, 0.4)',
  },
  buttons: {
    style: 'solid',
    radius: '10px',
    padding: '0.9em 1.6em',
    weight: 600,
    tracking: '0',
    transform: 'none',
  },
  images: {
    ratio: '4 / 3',
    radius: '14px',
    filter: 'none',
    hoverFilter: 'saturate(1.05)',
  },
  motion: {
    duration: '420ms',
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    revealShift: '14px',
  },
};

/** Presets disponíveis para `theme.preset` na configuração da implantação. */
export const THEME_PRESETS = {
  padrao,
  registro,
  editorial,
  expressivo,
  comercial,
};

/** Nomes válidos de preset, usados pela validação da configuração. */
export const THEME_PRESET_NAMES = Object.keys(THEME_PRESETS);

/** Preset por nome; nome desconhecido devolve `null` para o chamador avisar. */
export function getThemePreset(name) {
  return THEME_PRESETS[name] ?? null;
}
