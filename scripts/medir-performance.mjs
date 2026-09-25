/**
 * Mede o que cada página pública realmente entrega ao navegador.
 *
 * Otimizar sem número é chute: este script existe para dar a linha de base e
 * para repetir a medição depois de cada mudança. Roda contra o build de
 * produção, porque é ele que a implantação serve.
 *
 * Uso: node scripts/medir-performance.mjs [url-base]
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:3210';

const PAGINAS = [
  ['home', '/'],
  ['manifestação', '/manifestacao'],
  ['privacidade', '/privacidade'],
  ['login', '/painel/login'],
  ['agendar', '/agendar'],
];

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)}k`;
}

async function medir(browser, caminho) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // O observador precisa existir antes da navegação: `getEntriesByType` não
  // devolve LCP, que só chega por observer com `buffered`.
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((lista) => {
      for (const entrada of lista.getEntries())
        window.__lcp = entrada.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  const porTipo = new Map();
  let total = 0;

  page.on('response', async (resposta) => {
    const pedido = resposta.request();
    let tamanho = 0;
    try {
      const sizes = await resposta.request().sizes();
      tamanho = sizes.responseBodySize ?? 0;
    } catch {
      tamanho = 0;
    }
    const tipo = pedido.resourceType();
    porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + tamanho);
    total += tamanho;
  });

  await page.goto(`${BASE}${caminho}`, { waitUntil: 'load' });

  // LCP só fecha quando o carregamento assenta; um tempo curto de folga evita
  // ler um valor provisório.
  await page.waitForTimeout(1200);

  const metricas = await page.evaluate(() => {
    const entradas = performance.getEntriesByType('paint');
    const fcp = entradas.find((e) => e.name === 'first-contentful-paint');
    const lcp = window.__lcp ? { startTime: window.__lcp } : null;
    const nav = performance.getEntriesByType('navigation')[0];

    return {
      fcp: fcp ? Math.round(fcp.startTime) : null,
      lcp: lcp ? Math.round(lcp.startTime) : null,
      domInterativo: nav ? Math.round(nav.domInteractive) : null,
      pedidos: performance.getEntriesByType('resource').length + 1,
    };
  });

  await context.close();
  return { total, porTipo, metricas };
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
});

console.log(
  'página'.padEnd(16) +
    'total'.padStart(8) +
    'js'.padStart(8) +
    'css'.padStart(8) +
    'fonte'.padStart(8) +
    'img'.padStart(8) +
    'pedidos'.padStart(9) +
    'FCP'.padStart(7) +
    'LCP'.padStart(7),
);

for (const [nome, caminho] of PAGINAS) {
  const { total, porTipo, metricas } = await medir(browser, caminho);
  console.log(
    nome.padEnd(16) +
      kb(total).padStart(8) +
      kb(porTipo.get('script') ?? 0).padStart(8) +
      kb(porTipo.get('stylesheet') ?? 0).padStart(8) +
      kb(porTipo.get('font') ?? 0).padStart(8) +
      kb(porTipo.get('image') ?? 0).padStart(8) +
      String(metricas.pedidos).padStart(9) +
      `${metricas.fcp}ms`.padStart(7) +
      `${metricas.lcp}ms`.padStart(7),
  );
}

await browser.close();
