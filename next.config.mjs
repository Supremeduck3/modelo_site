import { fileURLToPath } from 'node:url';

/**
 * Cabeçalhos de segurança da implantação.
 *
 * Valem para tudo que a aplicação serve. São a camada que não depende de
 * nenhum componente lembrar de se comportar: mesmo que uma tela introduza uma
 * falha, o navegador recusa a exploração.
 *
 * O CSP fica de fora deste bloco e é montado abaixo, porque precisa de exceções
 * que mudam entre desenvolvimento e produção.
 */
const cabecalhosDeSeguranca = [
  {
    // Nenhuma página do molde é feita para rodar dentro de iframe de terceiro.
    // Sem isto, um site hostil embute o painel e captura cliques da equipe
    // (clickjacking).
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Impede o navegador de "adivinhar" o tipo de um arquivo servido: um upload
    // ou resposta de API interpretado como HTML viraria execução de script.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // O caminho de uma página do painel pode conter id de manifestação. Sem
    // isto, ele viajaria no Referer para qualquer site que a equipe abrisse a
    // partir de um link.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // O molde não usa câmera, microfone nem localização. Negar por padrão evita
    // que uma dependência futura peça acesso sem ninguém notar.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    // Só tem efeito sob HTTPS, que é como uma implantação real é servida: a
    // partir da primeira visita, o navegador se recusa a voltar para HTTP.
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

/**
 * Content-Security-Policy.
 *
 * As exceções estão aqui declaradas em vez de escondidas:
 *
 * - `'unsafe-inline'` em style-src: o Ant Design injeta CSS-in-JS em tempo de
 *   execução no painel, e os tokens de tema da implantação vão como style
 *   inline no <html>.
 * - `'unsafe-inline'` em script-src, **inclusive em produção**: o App Router
 *   entrega o próprio bootstrap e os dados do servidor em script inline. Isto
 *   é a exceção que mais custa — com ela, script-src deixa de conter XSS, que
 *   é a razão de script-src existir. O molde não tem script inline próprio, e
 *   a saída suportada é nonce por requisição (gerado no proxy, com
 *   `'strict-dynamic'`); o preço é que toda página passa a ser renderizada a
 *   cada requisição, inclusive as estáticas do site público. Fica como
 *   trabalho pendente, declarado, e não como algo já resolvido.
 * - `'unsafe-eval'` em script-src apenas em desenvolvimento, que é o que o
 *   recarregamento do Next usa. Em produção não entra.
 *
 * `img-src` aceita qualquer origem HTTPS de propósito: a mídia da implantação
 * pode estar em qualquer CDN, e é o implementador quem decide onde.
 */
function contentSecurityPolicy(desenvolvimento) {
  const script = ["'self'", "'unsafe-inline'"];
  if (desenvolvimento) script.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    // As fontes são servidas pelo próprio domínio (config/theme/fonts.js), por
    // isso nenhuma origem de fonte é liberada aqui. A implantação que usar
    // `typography.fontImport` para apontar uma folha externa precisa
    // acrescentar a origem dela em style-src e font-src.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Sem origem externa a chamar: o molde fala só com a própria API.
    "connect-src 'self'",
    // Mapa de contato é o único iframe legítimo, e vem de um provedor de mapas.
    'frame-src https:',
    // Complementa o X-Frame-Options para navegador que já o ignora.
    "frame-ancestors 'none'",
    "base-uri 'self'",
    // O formulário público só posta para a própria aplicação.
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  // Esconde a versão do Next na resposta: não é defesa, mas também não há
  // motivo para anunciar a versão exata a quem procura alvo.
  poweredByHeader: false,
  async headers() {
    const desenvolvimento = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/:path*',
        headers: [
          ...cabecalhosDeSeguranca,
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy(desenvolvimento),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
