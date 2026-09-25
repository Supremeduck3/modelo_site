import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNavigation } from '../src/config/site/navigation.js';

const navigation = {
  showCta: true,
  ctaLabel: 'Agendar horário',
  ctaHref: '/agendar',
  items: [
    { label: 'Início', href: '#inicio' },
    { label: 'Preços', href: '#precos' },
    { label: 'Agendar', href: '/agendar' },
    { label: 'Canal', href: '/manifestacao' },
    { label: 'Blog', href: 'https://exemplo.com/blog' },
    { label: 'Privacidade', href: '/privacidade' },
  ],
};

const sections = [
  { type: 'hero', id: 'inicio' },
  { type: 'pricing', id: 'precos' },
];

const tudoLigado = { booking: true, submissions: true, pricing: true };

test('âncoras viram /#id para funcionar fora da home', () => {
  const { navigation: nav } = resolveNavigation(navigation, {
    features: tudoLigado,
    sections,
  });
  const hrefs = nav.items.map((i) => i.href);
  assert.ok(hrefs.includes('/#inicio'));
  assert.ok(hrefs.includes('/#precos'));
  // Link externo e página comum não mudam.
  assert.ok(hrefs.includes('https://exemplo.com/blog'));
  assert.ok(hrefs.includes('/privacidade'));
});

test('funcionalidade desligada tira o item e o botão do menu', () => {
  const { navigation: nav, removidos } = resolveNavigation(navigation, {
    features: { ...tudoLigado, booking: false, submissions: false },
    sections,
  });
  const labels = nav.items.map((i) => i.label);
  assert.ok(!labels.includes('Agendar'));
  assert.ok(!labels.includes('Canal'));
  assert.equal(nav.showCta, false, 'CTA para /agendar some junto');
  assert.ok(removidos.includes('Agendar'));
});

test('âncora de seção que a home não mostra sai do menu', () => {
  // Preços desligado: a seção não está entre as renderizadas.
  const { navigation: nav } = resolveNavigation(navigation, {
    features: tudoLigado,
    sections: [{ type: 'hero', id: 'inicio' }],
  });
  assert.ok(!nav.items.some((i) => i.label === 'Preços'));
});

test('seção sem id conta pelo tipo, e /#id já escrito continua valendo', () => {
  const { navigation: nav } = resolveNavigation(
    {
      showCta: false,
      items: [
        { label: 'FAQ', href: '/#faq' },
        { label: 'Topo', href: '#' },
      ],
    },
    { features: tudoLigado, sections: [{ type: 'faq' }] },
  );
  assert.deepEqual(
    nav.items.map((i) => i.href),
    ['/#faq', '/'],
  );
});

test('subpágina de funcionalidade desligada também sai', () => {
  const { navigation: nav } = resolveNavigation(
    {
      showCta: true,
      ctaLabel: 'Acompanhar',
      ctaHref: '/agendar/pedido/X',
      items: [],
    },
    { features: { booking: false }, sections: [] },
  );
  assert.equal(nav.showCta, false);
});
