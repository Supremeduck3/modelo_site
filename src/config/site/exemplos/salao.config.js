/**
 * EXEMPLO: SALÃO DE BELEZA.
 *
 * Configuração completa de um salão, para copiar sobre `site.config.js` e
 * trocar os dados. Liga as três funcionalidades pensadas para esse tipo de
 * negócio:
 *
 *   - tabela de serviços com preço (a empresa edita no painel → Serviços e
 *     preços; para ver com dados de exemplo: `npm run db:seed:catalogo -- --salao`);
 *   - pedido de agendamento (o cliente pede em /agendar, a empresa confirma no
 *     painel → Agenda);
 *   - botão fixo de WhatsApp.
 *
 * Serve igual para barbearia, esmalteria, estética, pet shop com banho e tosa —
 * qualquer negócio que atende com hora marcada e combina pelo WhatsApp.
 *
 * Cores com contraste medido (texto ≥ 4,5:1 sobre fundo e superfície). Se
 * trocar, rode `npm test`: tests/contraste.test.js confere os presets, e
 * tests/booking-config.test.js confere este arquivo.
 *
 * O preset `editorial` usa Inter + Fraunces. Em src/config/theme/fonts.js,
 * deixe `preload: true` nessas duas famílias (e `false` nas outras): o título
 * da dobra espera a fonte dele.
 */

/** @type {import('../schema.js').DEFAULT_CONFIG} */
const salaoConfig = {
  identity: {
    name: 'Studio Bela',
    shortName: 'Bela',
    tagline: 'Cabelo, unhas e sobrancelha no centro da cidade',
    description:
      'Salão de beleza com atendimento com hora marcada. Corte, coloração, escova, manicure e design de sobrancelha.',
    logo: null,
    favicon: '/favicon.svg',
    segment: 'Salão de beleza',
  },
  contact: {
    email: 'contato@studiobela.com.br',
    phone: '(11) 3333-4444',
    whatsapp: '(11) 98765-4321',
    address: 'Rua das Flores, 120 — Centro',
    city: 'São Paulo',
    state: 'SP',
    mapEmbedUrl: '',
    businessHours: [
      { days: 'Terça a sexta', hours: '9h às 19h' },
      { days: 'Sábado', hours: '8h às 17h' },
    ],
    socials: [{ label: 'Instagram', href: 'https://instagram.com/' }],
    whatsappButton: {
      enabled: true,
      message: 'Olá! Vim pelo site e queria marcar um horário.',
    },
  },
  navigation: {
    variant: 'header',
    behavior: 'shrink-on-scroll',
    showCta: true,
    // Num salão, o botão principal do cabeçalho é agendar.
    ctaLabel: 'Agendar horário',
    ctaHref: '/agendar',
    items: [
      { label: 'Início', href: '#inicio' },
      { label: 'Preços', href: '#precos' },
      { label: 'O salão', href: '#salao' },
      { label: 'Dúvidas', href: '#faq' },
      { label: 'Contato', href: '#contato' },
    ],
  },
  theme: {
    preset: 'editorial',
    colors: {
      primary: '#9d174d',
      primaryContrast: '#ffffff',
      secondary: '#3b0a20',
      accent: '#d97706',
      background: '#fdf8f6',
      surface: '#f7eeeb',
      surfaceAlt: '#efe1dc',
      border: '#e8d6cf',
      text: '#2b1d24',
      textMuted: '#6b5560',
    },
  },
  media: {
    hero: null,
    about: null,
    gallery: [
      { src: null, alt: 'Salão visto da entrada', caption: 'Nosso espaço' },
      { src: null, alt: 'Bancada de manicure' },
      { src: null, alt: 'Lavatório' },
    ],
  },
  content: {
    hero: {
      eyebrow: 'Com hora marcada',
      title: 'Seu horário, do jeito que você gosta',
      subtitle:
        'Escolha o serviço e o dia pelo celular. A gente confirma pelo WhatsApp.',
      primaryCta: { label: 'Agendar horário', href: '/agendar' },
      secondaryCta: { label: 'Ver preços', href: '#precos' },
    },
    pricing: {
      title: 'Serviços e preços',
      note: 'Valores de referência; podem variar conforme o comprimento e o volume do cabelo.',
      ctaLabel: 'Agendar horário',
    },
    booking: {
      title: 'Agende seu horário',
      text: 'Escolha o serviço e o melhor dia. A gente confirma o horário com você pelo WhatsApp.',
      successText:
        'Recebemos seu pedido! Vamos confirmar o horário pelo WhatsApp em breve.',
    },
    gallery: { title: 'O salão', subtitle: 'Um espaço pensado para você.' },
    faq: {
      title: 'Dúvidas',
      items: [
        {
          question: 'Preciso marcar horário?',
          answer:
            'Sim, atendemos com hora marcada. Peça pelo site ou pelo WhatsApp.',
        },
        {
          question: 'E se eu precisar remarcar?',
          answer:
            'Sem problema: responda a mensagem de confirmação no WhatsApp com pelo menos 2 horas de antecedência.',
        },
        {
          question: 'Quais formas de pagamento vocês aceitam?',
          answer: 'Pix, dinheiro e cartões de débito e crédito.',
        },
      ],
    },
    contact: {
      title: 'Como chegar',
      subtitle: 'Estamos no centro, perto da estação.',
    },
  },
  pages: {
    home: {
      sections: [
        { type: 'hero', variant: 'split', id: 'inicio' },
        { type: 'pricing', variant: 'list', id: 'precos' },
        { type: 'gallery', variant: 'carousel', id: 'salao' },
        { type: 'faq', variant: 'accordion', id: 'faq' },
        { type: 'contact', variant: 'cards', id: 'contato' },
      ],
    },
  },
  features: {
    pricing: true,
    booking: true,
    gallery: true,
    faq: true,
    // O canal de manifestações continua disponível (é exigência do molde),
    // mas fora da home de um salão: fica no rodapé.
    submissions: true,
    testimonials: false,
    team: false,
  },
  booking: {
    timezone: 'America/Sao_Paulo',
    daysAhead: 30,
    // Fechado domingo e segunda, como a maioria dos salões.
    closedWeekdays: [0, 1],
    periods: ['manha', 'tarde', 'noite'],
    // Nomes das profissionais. Vazio esconde a pergunta "Com quem?".
    professionals: ['Carla', 'Juliana', 'Rafa'],
  },
  seo: {
    title: 'Studio Bela — salão de beleza no centro',
    description:
      'Corte, coloração, escova, manicure e sobrancelha com hora marcada. Agende pelo site ou WhatsApp.',
    keywords: ['salão de beleza', 'cabeleireiro', 'manicure', 'agendar'],
    siteUrl: '',
    localBusiness: true,
  },
};

export default salaoConfig;
