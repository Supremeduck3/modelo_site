/**
 * Schema declarativo da configuração de implantação.
 *
 * O molde é "configuração + dados + componentes". Este arquivo define a forma
 * esperada da configuração, os valores padrão e a validação em runtime.
 * Nenhum dado específico de cliente deve morar aqui — apenas fallbacks seguros.
 */

import { BOOKING_PERIOD_VALUES } from '../../lib/booking/constants.js';
import { getThemePreset, THEME_PRESET_NAMES } from '../theme/presets.js';

/** Variantes de navegação suportadas pelo motor visual. */
export const NAVIGATION_VARIANTS = ['header', 'header-compact', 'sidebar'];

/** Comportamentos de navegação suportados. */
export const NAVIGATION_BEHAVIORS = ['fixed', 'static', 'shrink-on-scroll'];

/** Posições suportadas para a navegação. */
export const NAVIGATION_POSITIONS = ['top', 'left', 'right'];

/** Modelos comerciais de contratação de uma implantação. */
export const DEPLOYMENT_MODES = [
  {
    value: 'assinatura',
    label: 'Assinatura',
    description:
      'Acompanhamento contínuo: quem implantou segue com acesso e administra o banco.',
  },
  {
    value: 'avulso',
    label: 'Pagamento único',
    description:
      'Entrega sem acompanhamento: banco e conta ficam com o cliente, e o acesso de quem implantou é encerrado.',
  },
];

export const DEPLOYMENT_MODE_VALUES = DEPLOYMENT_MODES.map((m) => m.value);

/** Rótulo e explicação de um modo, com fallback para o próprio valor. */
export function deploymentModeInfo(value) {
  return (
    DEPLOYMENT_MODES.find((mode) => mode.value === value) ?? {
      value,
      label: value,
      description: '',
    }
  );
}

/** Seções da home e as variantes visuais disponíveis para cada uma. */
export const SECTION_VARIANTS = {
  hero: ['full-image', 'split', 'centered', 'cta-focus'],
  about: ['simple', 'image-text', 'stats'],
  services: ['cards', 'list', 'grid', 'image-text', 'feature'],
  differentials: ['icons', 'cards', 'side-blocks'],
  gallery: ['grid', 'masonry', 'carousel'],
  testimonials: ['cards', 'slider', 'single'],
  team: ['cards', 'list', 'highlight'],
  faq: ['accordion', 'blocks', 'two-columns'],
  contact: ['cards', 'map', 'form-split'],
  submission: ['cta', 'embedded'],
  pricing: ['list', 'cards'],
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
    // Aponta para o ícone neutro que acompanha o molde; troque pelo símbolo
    // da empresa na implantação.
    favicon: '/favicon.svg',
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
    /**
     * Botão fixo de WhatsApp no canto da tela.
     *
     * Usa `contact.whatsapp`; sem número, não aparece mesmo ligado. A mensagem
     * já vem escrita na conversa — o cliente só aperta enviar.
     */
    whatsappButton: {
      enabled: false,
      message: 'Olá! Vim pelo site e gostaria de mais informações.',
    },
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
    // Direção de arte da implantação. Ver src/config/theme/presets.js.
    preset: 'padrao',
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
      /*
       * Estados. O verde anterior (#1f9254) media 3,96:1 sobre branco e era
       * usado como texto e como fundo de etiqueta com texto branco.
       */
      success: '#1c6b3c',
      danger: '#b3261e',
      warning: '#8a5000',
      // Borda de controle (campo, caixa de seleção): 3:1 sobre o fundo.
      borderStrong: '#7d8699',
      // Anel de foco. Vazio usa a primária; blocos escuros invertem sozinhos.
      focus: null,
    },
    typography: {
      // URL de webfont da direção de arte; null mantém as fontes do sistema.
      fontImport: null,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      headingFamily: null,
      // Dados: protocolo, datas, horários e contagens (algarismos tabulares).
      monoFamily: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
      baseSize: '16px',
      headingWeight: 700,
      bodyWeight: 400,
      lineHeight: 1.6,
      // Multiplicador da escala tipográfica: só os títulos crescem, o corpo não.
      displayScale: 1,
      headingTracking: '-0.02em',
      headingTransform: 'none',
      headingLineHeight: 1.15,
      eyebrowTracking: '0.1em',
    },
    shape: {
      radius: '12px',
      radiusSmall: '8px',
      radiusLarge: '24px',
      borderWidth: '1px',
    },
    spacing: {
      sectionY: '96px',
      sectionYMobile: '56px',
      containerWidth: '1160px',
      gap: '24px',
      // Respiro entre blocos de uma composição (coluna de texto x mídia).
      gapLarge: '64px',
      // Medida de leitura confortável dos parágrafos longos.
      measure: '62ch',
    },
    shadows: {
      soft: '0 2px 8px rgba(16, 24, 40, 0.06)',
      medium: '0 8px 24px rgba(16, 24, 40, 0.1)',
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
    contact: {
      calloutTitle: 'Prefere escrever?',
      calloutText:
        'Registre sua mensagem no canal de manifestações e acompanhe pelo número de protocolo.',
      calloutCta: null,
    },
    pricing: {
      title: 'Serviços e preços',
      subtitle: '',
      note: 'Valores de referência; podem variar conforme o serviço.',
      ctaLabel: 'Agendar horário',
    },
    booking: {
      title: 'Agende seu horário',
      text: 'Escolha o serviço e o melhor dia. A gente confirma o horário com você.',
      successText:
        'Recebemos seu pedido. Vamos confirmar o horário pelo WhatsApp ou por e-mail.',
    },
    submission: {
      title: 'Canal de manifestações',
      text: '',
      ctaLabel: null,
      ctaHref: null,
      steps: [
        {
          title: 'Você registra',
          text: 'Escolha o tipo, descreva o ocorrido e informe um contato.',
        },
        {
          title: 'Geramos um protocolo',
          text: 'O número identifica sua manifestação e permite acompanhamento.',
        },
        {
          title: 'A equipe responde',
          text: 'A empresa analisa, classifica e retorna pelo canal informado.',
        },
      ],
    },
  },
  pages: {
    home: { sections: [{ type: 'hero', variant: 'split' }] },
  },
  // Declarar a seção na home já é o opt-in; a flag existe para desligar um
  // bloco sem mexer na lista de seções.
  features: {
    submissions: true,
    gallery: true,
    testimonials: true,
    team: true,
    faq: true,
    /** Tabela de serviços com preço, editada no painel. */
    pricing: false,
    /** Pedido de agendamento pelo site, confirmado pela empresa no painel. */
    booking: false,
  },
  /**
   * Regras do pedido de agendamento.
   *
   * É pedido, não reserva: o cliente sugere dia e período e a empresa confirma
   * um horário. Por isso não há grade de horários aqui — só o que evita pedido
   * que a empresa sabe de antemão que vai recusar.
   */
  booking: {
    /** Fuso da empresa: decide o que é "hoje" para o formulário. */
    timezone: 'America/Sao_Paulo',
    /** Até quantos dias à frente o cliente pode pedir. */
    daysAhead: 21,
    /** Dias sem atendimento (0 = domingo … 6 = sábado). */
    closedWeekdays: [0],
    /** Períodos oferecidos (ver BOOKING_PERIODS em lib/booking/constants). */
    periods: ['manha', 'tarde'],
    /** Profissionais que o cliente pode preferir. Vazio esconde a pergunta. */
    professionals: [],
  },
  seo: {
    title: null,
    description: null,
    keywords: [],
    openGraphImage: null,
    locale: 'pt_BR',
    siteUrl: '',
    localBusiness: false,
    /**
     * Deixa o site fora dos buscadores.
     *
     * Serve para homologação: uma implantação em teste indexada antes da hora
     * concorre com o site que vai de fato entrar no ar.
     */
    noindex: false,
  },
  /**
   * Modelo comercial desta implantação.
   *
   * Não liga nem desliga nada: registra como o site foi contratado, o que muda
   * quem administra o banco e quem responde pela conta na entrega.
   *
   * Regra que vale independentemente do valor: **nada no código consulta
   * serviço externo para decidir se o site funciona**. Uma implantação entregue
   * precisa seguir de pé sozinha, mesmo que nenhum servidor do implementador
   * exista mais.
   */
  deployment: {
    mode: 'assinatura',
    notes: '',
  },
  legal: {
    consentText:
      'Autorizo o uso dos meus dados de contato para retorno sobre esta manifestação.',
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

/** Fuso inválido derruba `Intl`; conferimos antes de usar. */
function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Corrige o bloco `booking` para valores utilizáveis, avisando o que mudou.
 *
 * Um erro de digitação aqui (período inexistente, dia 7) não pode tirar o
 * formulário do ar: vira aviso e o valor cai no padrão.
 */
function validateBooking(config, warnings) {
  const padrao = DEFAULT_CONFIG.booking;
  const booking = { ...padrao, ...config.booking };

  if (!isValidTimeZone(booking.timezone)) {
    warnings.push(
      `booking.timezone "${booking.timezone}" inválido; usando "${padrao.timezone}".`,
    );
    booking.timezone = padrao.timezone;
  }

  const dias = Number(booking.daysAhead);
  if (!Number.isInteger(dias) || dias < 1 || dias > 90) {
    warnings.push(
      `booking.daysAhead precisa ser inteiro entre 1 e 90; usando ${padrao.daysAhead}.`,
    );
    booking.daysAhead = padrao.daysAhead;
  }

  const fechados = Array.isArray(booking.closedWeekdays)
    ? booking.closedWeekdays
    : [];
  booking.closedWeekdays = [
    ...new Set(
      fechados.filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6),
    ),
  ];
  if (booking.closedWeekdays.length === 7) {
    warnings.push(
      'booking.closedWeekdays fecha todos os dias; ninguém conseguiria pedir horário. Usando o padrão.',
    );
    booking.closedWeekdays = padrao.closedWeekdays;
  }

  const periodos = (
    Array.isArray(booking.periods) ? booking.periods : []
  ).filter((periodo) => BOOKING_PERIOD_VALUES.includes(periodo));
  if (periodos.length === 0) {
    warnings.push(
      `booking.periods sem período válido; usando ${padrao.periods.join(', ')}. Disponíveis: ${BOOKING_PERIOD_VALUES.join(', ')}.`,
    );
  }
  // Mantém a ordem do dia, não a ordem digitada.
  booking.periods = BOOKING_PERIOD_VALUES.filter((periodo) =>
    (periodos.length ? periodos : padrao.periods).includes(periodo),
  );

  booking.professionals = (
    Array.isArray(booking.professionals) ? booking.professionals : []
  )
    .filter((nome) => typeof nome === 'string' && nome.trim())
    .map((nome) => nome.trim());

  config.booking = booking;
}

/**
 * Valida a configuração e devolve { config, errors, warnings }.
 * Erros de digitação em variantes viram warning + fallback, nunca tela branca.
 */
export function validateSiteConfig(rawConfig) {
  const errors = [];
  const warnings = [];

  /*
   * O preset entra entre os padrões e a configuração da implantação: adotar
   * uma direção de arte não impede o cliente de corrigir um token isolado.
   */
  const presetName = rawConfig?.theme?.preset ?? DEFAULT_CONFIG.theme.preset;
  const preset = getThemePreset(presetName);
  if (!preset) {
    warnings.push(
      `theme.preset "${presetName}" não existe; usando "padrao". Disponíveis: ${THEME_PRESET_NAMES.join(', ')}.`,
    );
  }
  const withPreset = mergeDeep(DEFAULT_CONFIG, {
    theme: preset ?? getThemePreset('padrao'),
  });
  const config = mergeDeep(withPreset, rawConfig ?? {});
  config.theme.preset = preset ? presetName : 'padrao';

  if (!config.identity.name?.trim()) {
    errors.push('identity.name é obrigatório.');
  }

  // Modo comercial desconhecido vira aviso e cai no padrão: é um registro
  // administrativo, e um valor errado não pode derrubar o site de ninguém.
  if (typeof config.deployment?.notes !== 'string') {
    config.deployment = { ...config.deployment, notes: '' };
  }

  if (!DEPLOYMENT_MODE_VALUES.includes(config.deployment?.mode)) {
    warnings.push(
      `deployment.mode "${config.deployment?.mode}" desconhecido; usando "assinatura". Disponíveis: ${DEPLOYMENT_MODE_VALUES.join(', ')}.`,
    );
    config.deployment = { ...config.deployment, mode: 'assinatura' };
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

  validateBooking(config, warnings);

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
