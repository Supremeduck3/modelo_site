/**
 * CONFIGURAÇÃO DESTA IMPLANTAÇÃO.
 *
 * Este é o único arquivo que o implementador edita para dar cara a um cliente.
 * Nenhum componente deve conter dados de cliente — tudo vem daqui.
 * Veja src/config/site/schema.js para as variantes disponíveis.
 */

/** @type {import('./schema.js').DEFAULT_CONFIG} */
const siteConfig = {
  identity: {
    name: 'Demo Serviços',
    shortName: 'Demo',
    tagline: 'Soluções sob medida para o seu dia a dia',
    description:
      'Empresa demonstrativa usada para exercitar o molde. Substitua estes dados na implantação real.',
    logo: null,
    favicon: '/favicon.ico',
    segment: 'Serviços locais',
  },
  contact: {
    email: 'contato@exemplo.com.br',
    phone: '(00) 0000-0000',
    whatsapp: '(00) 90000-0000',
    address: 'Rua Exemplo, 123 — Centro',
    city: 'Cidade',
    state: 'UF',
    mapEmbedUrl: '',
    businessHours: [
      { days: 'Segunda a sexta', hours: '08h às 18h' },
      { days: 'Sábado', hours: '08h às 12h' },
    ],
    socials: [
      { label: 'Instagram', href: 'https://instagram.com/' },
      { label: 'Facebook', href: 'https://facebook.com/' },
    ],
  },
  navigation: {
    variant: 'header',
    position: 'top',
    behavior: 'shrink-on-scroll',
    mobile: 'drawer',
    showCta: true,
    ctaLabel: 'Enviar manifestação',
    ctaHref: '/manifestacao',
    items: [
      { label: 'Início', href: '#inicio' },
      { label: 'Sobre', href: '#sobre' },
      { label: 'Serviços', href: '#servicos' },
      { label: 'Diferenciais', href: '#diferenciais' },
      { label: 'Dúvidas', href: '#faq' },
      { label: 'Contato', href: '#contato' },
    ],
  },
  theme: {
    /*
     * Direção de arte da implantação (src/config/theme/presets.js):
     * padrao | editorial | expressivo | comercial.
     * O preset define tipografia, forma, espaçamento, tratamento de imagem e
     * intensidade das animações. O que vier abaixo dele é correção pontual.
     */
    preset: 'comercial',
    colors: {
      primary: '#1f6feb',
      secondary: '#0b3a7a',
      accent: '#f0a202',
    },
  },
  media: {
    hero: null,
    about: null,
  },
  content: {
    hero: {
      eyebrow: 'Atendimento local',
      title: 'Serviços confiáveis, do orçamento à entrega',
      subtitle:
        'Equipe própria, prazo combinado e canal aberto para você falar com a gente a qualquer momento.',
      primaryCta: { label: 'Fale conosco', href: '#contato' },
      secondaryCta: { label: 'Nossos serviços', href: '#servicos' },
      // Usado pelas variantes de hero que têm linha de apoio (ex.: centered).
      highlights: ['10 anos de atuação', 'Equipe própria', 'Toda a região'],
    },
    about: {
      title: 'Sobre a empresa',
      text: 'Atuamos há mais de dez anos atendendo famílias e pequenos negócios da região, com equipe própria e compromisso de prazo.',
      stats: [
        { value: '10+', label: 'anos de atuação' },
        { value: '1.200', label: 'atendimentos concluídos' },
        { value: '98%', label: 'clientes satisfeitos' },
      ],
    },
    services: {
      title: 'O que fazemos',
      subtitle: 'Escopo definido, orçamento claro e prazo combinado.',
      items: [
        {
          title: 'Instalação',
          description:
            'Projeto e instalação completa com material certificado.',
        },
        {
          title: 'Manutenção',
          description:
            'Planos preventivos e atendimento corretivo com hora marcada.',
        },
        {
          title: 'Consultoria',
          description: 'Diagnóstico técnico e recomendação de melhorias.',
        },
      ],
    },
    differentials: {
      title: 'Por que nos escolher',
      items: [
        {
          title: 'Equipe própria',
          description: 'Sem terceirização em nenhuma etapa.',
        },
        {
          title: 'Prazo combinado',
          description: 'Cronograma acordado antes de iniciar.',
        },
        {
          title: 'Garantia',
          description: 'Cobertura formal em todos os serviços.',
        },
      ],
    },
    faq: {
      title: 'Perguntas frequentes',
      items: [
        {
          question: 'Vocês atendem fora da cidade?',
          answer:
            'Sim, atendemos toda a região metropolitana mediante agendamento.',
        },
        {
          question: 'Como funciona o orçamento?',
          answer:
            'A visita técnica é agendada em até 48h e o orçamento é enviado por e-mail.',
        },
      ],
    },
    contact: {
      title: 'Fale com a gente',
      subtitle:
        'Escolha o canal mais conveniente ou registre uma manifestação.',
    },
    submission: {
      title: 'Canal de manifestações',
      text: 'Reclamações, elogios, sugestões, dúvidas ou solicitações: registre e acompanhe pelo número de protocolo.',
      ctaLabel: 'Registrar manifestação',
    },
  },
  pages: {
    home: {
      sections: [
        { type: 'hero', variant: 'split', id: 'inicio' },
        { type: 'about', variant: 'stats', id: 'sobre' },
        { type: 'services', variant: 'cards', id: 'servicos' },
        { type: 'differentials', variant: 'icons', id: 'diferenciais' },
        { type: 'faq', variant: 'accordion', id: 'faq' },
        { type: 'submission', variant: 'cta', id: 'canal' },
        { type: 'contact', variant: 'cards', id: 'contato' },
      ],
    },
  },
  features: {
    submissions: true,
    faq: true,
    gallery: false,
    testimonials: false,
    team: false,
  },
  seo: {
    title: 'Demo Serviços — serviços locais com prazo e garantia',
    description:
      'Instalação, manutenção e consultoria para famílias e pequenos negócios da região.',
    keywords: ['serviços', 'manutenção', 'instalação'],
    siteUrl: '',
    localBusiness: true,
  },
  legal: {
    privacyPolicy: '',
    terms: '',
  },
};

export default siteConfig;
