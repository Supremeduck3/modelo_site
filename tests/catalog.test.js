import assert from 'node:assert/strict';
import test from 'node:test';
import {
  centsToInput,
  formatDuration,
  formatPrice,
  parsePriceToCents,
} from '../src/lib/catalog/format.js';
import { validateOffering } from '../src/lib/catalog/schema.js';
import {
  formatPhone,
  normalizeWhatsappNumber,
  telLink,
  whatsappLink,
} from '../src/lib/whatsapp.js';

/* ───────── preço ───────── */

test('preço aceita o jeito brasileiro de escrever', () => {
  assert.equal(parsePriceToCents('35'), 3500);
  assert.equal(parsePriceToCents('35,9'), 3590);
  assert.equal(parsePriceToCents('35,90'), 3590);
  assert.equal(parsePriceToCents('R$ 1.234,50'), 123450);
  // Teclado numérico de celular muitas vezes só tem ponto.
  assert.equal(parsePriceToCents('35.90'), 3590);
  assert.equal(parsePriceToCents('1.234'), 123400, 'ponto de milhar');
});

test('preço vazio é "sob consulta"; texto que não é preço é recusado', () => {
  assert.equal(parsePriceToCents(''), null);
  assert.equal(parsePriceToCents(null), null);
  assert.ok(Number.isNaN(parsePriceToCents('abc')));
  assert.ok(Number.isNaN(parsePriceToCents('12,345')));
});

test('sem ponto flutuante no caminho: 0,1 + 0,2 não some centavo', () => {
  assert.equal(parsePriceToCents('0,1') + parsePriceToCents('0,2'), 30);
});

test('formatação de preço e duração', () => {
  assert.equal(formatPrice(3590), 'R$ 35,90');
  assert.equal(formatPrice(3500, true), 'a partir de R$ 35,00');
  assert.equal(formatPrice(null), 'Sob consulta');
  // Zero existe (retoque em garantia) e não pode virar "sob consulta".
  assert.equal(formatPrice(0), 'R$ 0,00');
  assert.equal(formatDuration(40), '40 min');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(90), '1h30');
  assert.equal(formatDuration(null), null);
  assert.equal(centsToInput(3590), '35,90');
  assert.equal(centsToInput(null), '');
});

test('item da tabela: preço vira centavos, erros apontam o campo', () => {
  const ok = validateOffering({
    name: ' Corte ',
    price: '45,00',
    durationMinutes: 40,
  });
  assert.ok(ok.success);
  assert.equal(ok.data.name, 'Corte');
  assert.equal(ok.data.price, 4500);
  assert.equal(ok.data.bookable, true);

  const ruim = validateOffering({
    name: 'C',
    price: 'abc',
    durationMinutes: 3,
  });
  assert.ok(!ruim.success);
  assert.ok(ruim.errors.name);
  assert.ok(ruim.errors.price);
  assert.ok(ruim.errors.durationMinutes);

  // Um zero a mais é o erro mais provável: o teto pega.
  assert.ok(!validateOffering({ name: 'Corte', price: '4500000' }).success);
});

/* ───────── WhatsApp e telefone ───────── */

test('número brasileiro sem 55 ganha o código do país', () => {
  assert.equal(normalizeWhatsappNumber('(11) 98765-4321'), '5511987654321');
  assert.equal(normalizeWhatsappNumber('11 3333-4444'), '551133334444');
  assert.equal(normalizeWhatsappNumber('+55 11 98765-4321'), '5511987654321');
  assert.equal(normalizeWhatsappNumber('123'), null);
  assert.equal(normalizeWhatsappNumber(''), null);
});

test('link do WhatsApp leva a mensagem codificada; sem número, nada', () => {
  assert.equal(
    whatsappLink('11987654321', 'Olá! Quero agendar'),
    'https://wa.me/5511987654321?text=Ol%C3%A1!%20Quero%20agendar',
  );
  assert.equal(whatsappLink('11987654321'), 'https://wa.me/5511987654321');
  assert.equal(whatsappLink('', 'oi'), null);
  assert.equal(telLink('11987654321'), 'tel:+5511987654321');
});

test('telefone legível com e sem o 55', () => {
  assert.equal(formatPhone('11987654321'), '(11) 98765-4321');
  assert.equal(formatPhone('5511987654321'), '(11) 98765-4321');
  assert.equal(formatPhone('1133334444'), '(11) 3333-4444');
  assert.equal(formatPhone('999'), '999');
});
