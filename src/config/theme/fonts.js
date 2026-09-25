import { Archivo, Fraunces, Inter, Space_Grotesk } from 'next/font/google';

/**
 * FONTES DAS DIREÇÕES DE ARTE, servidas pelo próprio domínio.
 *
 * Antes as famílias vinham do Google Fonts por `<link>`. O custo aparecia na
 * medição: a folha de estilo externa levava ~309 ms (DNS + TLS + resposta) e o
 * título da home — que é o maior elemento da dobra — só assentava em 940 ms,
 * porque o texto trocava de fonte depois de pintado. Com `next/font` os
 * arquivos são baixados na build e servidos como recurso nosso, sem terceiro no
 * caminho crítico e sem o CSP precisar liberar domínio de fora.
 *
 * As quatro famílias são declaradas aqui porque `next/font` exige chamada
 * literal em escopo de módulo — não dá para escolher por configuração em tempo
 * de execução. Isso não custa download: declarar só emite a regra `@font-face`,
 * e o navegador busca o arquivo apenas da família que alguma regra usa. A
 * implantação que fica no preset padrão (fonte de sistema) não baixa nenhuma.
 *
 * Por isso também `preload: false`: com quatro declaradas e uma ou duas em uso,
 * pré-carregar todas gastaria banda da dobra com arquivo que não vai ser
 * pintado. As que entram são descobertas no CSS da própria página.
 */

/*
 * As opções vão repetidas em cada chamada porque `next/font` é lido na build
 * por análise estática: objeto espalhado (`...comum`) faz a build falhar com
 * "Unexpected spread". Conferido.
 *
 * `display: 'swap'` deixa o texto aparecer na fonte de sistema e trocar quando
 * a família chega; `block` deixaria a dobra em branco.
 */
// Corpo do preset ativo.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-fraunces',
});

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-archivo',
});

// Títulos do preset ativo: é o elemento que decide o LCP da home.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-space-grotesk',
});

/**
 * Classe que declara as variáveis das quatro famílias, aplicada no `<html>`.
 *
 * Os presets referenciam essas variáveis (`var(--font-inter)`), então trocar de
 * direção de arte continua sendo mexer só na configuração.
 */
export const fontVariablesClassName = [
  inter.variable,
  fraunces.variable,
  archivo.variable,
  spaceGrotesk.variable,
].join(' ');
