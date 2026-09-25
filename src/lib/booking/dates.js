/**
 * Datas do agendamento.
 *
 * Dia é texto "AAAA-MM-DD" do começo ao fim — no formulário, na API e no banco
 * (coluna DATE). A conta de dias é feita em UTC sobre esse texto, onde não há
 * horário de verão nem fuso para deslocar um dia para trás. O fuso da empresa
 * entra num lugar só: descobrir que dia é "hoje" lá.
 *
 * Sem dependência: roda no navegador, no servidor e nos testes.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
const PADRAO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const PADRAO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function paraUtc(ymd) {
  return new Date(`${ymd}T00:00:00Z`);
}

/** Diz se o texto é um dia de calendário que existe ("2026-02-30" não é). */
export function isValidDate(ymd) {
  if (typeof ymd !== 'string' || !PADRAO_DIA.test(ymd)) return false;
  const data = paraUtc(ymd);
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(ymd);
}

/** "HH:MM" de 00:00 a 23:59. */
export function isValidTime(hhmm) {
  return typeof hhmm === 'string' && PADRAO_HORA.test(hhmm);
}

/** Dia de hoje no fuso da empresa, como "AAAA-MM-DD". */
export function todayIn(timeZone, now = new Date()) {
  // en-CA formata como AAAA-MM-DD, que é o que queremos sem montar à mão.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(ymd, dias) {
  return new Date(paraUtc(ymd).getTime() + dias * DIA_MS)
    .toISOString()
    .slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
export function weekdayOf(ymd) {
  return paraUtc(ymd).getUTCDay();
}

/**
 * Dias que o cliente pode pedir: de hoje até `daysAhead` dias, sem os dias
 * fechados.
 *
 * Hoje entra: salão atende encaixe no mesmo dia, e quem decide se ainda dá é a
 * empresa ao confirmar — o formulário não sabe a agenda.
 */
export function bookableDates(
  { timezone, daysAhead, closedWeekdays = [] },
  now = new Date(),
) {
  const hoje = todayIn(timezone, now);
  const dias = [];
  for (let i = 0; i < daysAhead; i += 1) {
    const dia = addDays(hoje, i);
    if (!closedWeekdays.includes(weekdayOf(dia))) dias.push(dia);
  }
  return dias;
}

/** Diz se o dia pode ser pedido pelas regras da implantação. */
export function isBookableDate(ymd, regras, now = new Date()) {
  return isValidDate(ymd) && bookableDates(regras, now).includes(ymd);
}

const FORMATO = {
  curto: new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
  }),
  semana: new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
  }),
  mes: new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'short' }),
  longo: new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
};

const semPonto = (texto) => texto.replace('.', '');

/** Partes para o seletor de dias: { semana: "ter", dia: "29", mes: "set" }. */
export function dateParts(ymd) {
  const data = paraUtc(ymd);
  return {
    semana: semPonto(FORMATO.semana.format(data)),
    dia: String(data.getUTCDate()),
    mes: semPonto(FORMATO.mes.format(data)),
  };
}

/** "29/09". */
export function formatDateShort(ymd) {
  return FORMATO.curto.format(paraUtc(ymd));
}

/** "terça-feira, 29 de setembro". */
export function formatDateLong(ymd) {
  return FORMATO.longo.format(paraUtc(ymd));
}

/**
 * Coluna DATE do banco vem como Date à meia-noite UTC; volta para texto.
 * Aceita também o texto já pronto, para quem chama não precisar saber.
 */
export function toYmd(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  return valor.toISOString().slice(0, 10);
}
