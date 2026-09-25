import { siteConfig } from '@/config/site';
import {
  APPOINTMENT_ACTIONS,
  APPOINTMENT_EVENTS,
} from '@/lib/booking/constants';
import { isBookableDate, todayIn, toYmd } from '@/lib/booking/dates';
import { validateAppointmentAction } from '@/lib/booking/management-schema';
import { validateAppointmentRequest } from '@/lib/booking/schema';
import {
  generateProtocol,
  isValidProtocol,
  normalizeProtocol,
} from '@/lib/submissions/protocol';
import { prisma } from '@/server/db/client';
import { getCurrentCompany } from '@/server/modules/company/service';

/** Erro de negócio com código estável, para a rota traduzir em HTTP. */
export class BookingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
    this.details = details;
  }
}

const MAX_CODE_ATTEMPTS = 5;

/** Remove caracteres de controle do texto livre (mesma regra do canal). */
function sanitize(value) {
  if (typeof value !== 'string') return value;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: a intenção é justamente remover caracteres de controle.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/** Coluna DATE do Prisma recebe Date; o dia é meia-noite UTC. */
const paraDate = (ymd) => new Date(`${ymd}T00:00:00Z`);

const invalido = (details) =>
  new BookingError('validation_error', 'Dados inválidos.', details);

/**
 * Registra um pedido de agendamento vindo do site.
 *
 * Além do formato (lib/booking/schema.js), confere o que depende desta
 * implantação e do banco: o serviço existe, está ativo e aceita agendamento;
 * o dia está dentro da janela e não é dia fechado; o período é oferecido; o
 * profissional, se escolhido, é um dos configurados. O cliente que burla o
 * formulário esbarra aqui do mesmo jeito.
 */
export async function createAppointmentRequest(rawInput, now = new Date()) {
  if (!siteConfig.features.booking) {
    throw new BookingError('not_found', 'Agendamento indisponível.');
  }

  const { success, data, errors } = validateAppointmentRequest(rawInput);
  if (!success) throw invalido(errors);

  const regras = siteConfig.booking;

  if (!regras.periods.includes(data.period)) {
    throw invalido({ period: 'Esse período não está disponível.' });
  }
  if (!isBookableDate(data.date, regras, now)) {
    throw invalido({ date: 'Esse dia não está disponível. Escolha outro.' });
  }
  if (data.professional && !regras.professionals.includes(data.professional)) {
    throw invalido({ professional: 'Profissional indisponível.' });
  }

  const company = await getCurrentCompany();

  const service = await prisma.serviceOffering.findFirst({
    where: {
      id: String(data.serviceId),
      companyId: company.id,
      isActive: true,
      bookable: true,
    },
    select: { id: true, name: true },
  });
  if (!service) {
    throw invalido({ serviceId: 'Esse serviço não está disponível.' });
  }

  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateProtocol(now);

    try {
      return await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            companyId: company.id,
            code,
            serviceId: service.id,
            serviceName: service.name,
            professional: data.professional,
            requestedDate: paraDate(data.date),
            requestedPeriod: data.period,
            customerName: sanitize(data.customerName),
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            notes: sanitize(data.notes),
          },
        });

        await tx.appointmentEvent.create({
          data: {
            appointmentId: appointment.id,
            eventType: APPOINTMENT_EVENTS.REQUESTED,
            toValue: appointment.status,
          },
        });

        /*
         * O cliente recebe de volta só o código e o que ele mesmo escolheu. O
         * resto (telefone, observação) alimenta o aviso à equipe.
         */
        return {
          appointment: {
            code: appointment.code,
            serviceName: appointment.serviceName,
            requestedDate: data.date,
            requestedPeriod: appointment.requestedPeriod,
            status: appointment.status,
          },
          forNotification: {
            code: appointment.code,
            serviceName: appointment.serviceName,
            professional: appointment.professional,
            requestedDate: data.date,
            requestedPeriod: appointment.requestedPeriod,
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            customerEmail: appointment.customerEmail,
            notes: appointment.notes,
          },
        };
      });
    } catch (error) {
      const colisao =
        error?.code === 'P2002' &&
        String(error?.meta?.target ?? '').includes('code');
      if (!colisao || attempt === MAX_CODE_ATTEMPTS) throw error;
    }
  }

  throw new BookingError('code_exhausted', 'Não foi possível gerar o código.');
}

/**
 * Situação de um pedido pelo código, para a página de acompanhamento.
 *
 * O código é aleatório e não sequencial, e mesmo assim a página não mostra
 * nome, telefone nem e-mail: quem tiver o link vê o serviço, o dia e a
 * situação — o suficiente para o cliente, nada que exponha ninguém.
 */
export async function getAppointmentByCode(rawCode) {
  const code = normalizeProtocol(rawCode);
  // Formato errado nem chega ao banco: não há pedido possível com esse código.
  if (!isValidProtocol(code)) return null;

  const company = await getCurrentCompany();
  const appointment = await prisma.appointment.findFirst({
    where: { code, companyId: company.id },
    select: {
      code: true,
      serviceName: true,
      professional: true,
      requestedDate: true,
      requestedPeriod: true,
      status: true,
      scheduledDate: true,
      scheduledTime: true,
      responseMessage: true,
      createdAt: true,
    },
  });
  if (!appointment) return null;

  return {
    ...appointment,
    requestedDate: toYmd(appointment.requestedDate),
    scheduledDate: toYmd(appointment.scheduledDate),
  };
}

const LIST_SELECT = {
  id: true,
  code: true,
  serviceName: true,
  professional: true,
  requestedDate: true,
  requestedPeriod: true,
  customerName: true,
  customerPhone: true,
  status: true,
  scheduledDate: true,
  scheduledTime: true,
  createdAt: true,
};

function normalizarDatas(item) {
  return {
    ...item,
    requestedDate: toYmd(item.requestedDate),
    scheduledDate: toYmd(item.scheduledDate),
  };
}

/**
 * Listas da agenda no painel.
 *
 * - `pendentes`: pedidos esperando resposta, os mais antigos primeiro — quem
 *   pediu primeiro espera há mais tempo.
 * - `proximos`: confirmados de hoje em diante, na ordem do dia e da hora.
 * - `historico`: tudo, os mais recentes primeiro, limitado.
 */
export async function listAppointments(companyId, view = 'pendentes') {
  if (!companyId) throw new Error('Listagem exige companyId.');

  if (view === 'proximos') {
    const hoje = paraDate(todayIn(siteConfig.booking.timezone));
    const itens = await prisma.appointment.findMany({
      where: {
        companyId,
        status: 'confirmed',
        scheduledDate: { gte: hoje },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
      select: LIST_SELECT,
      take: 200,
    });
    return itens.map(normalizarDatas);
  }

  if (view === 'historico') {
    const itens = await prisma.appointment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: LIST_SELECT,
      take: 200,
    });
    return itens.map(normalizarDatas);
  }

  const itens = await prisma.appointment.findMany({
    where: { companyId, status: { in: ['pending', 'proposed'] } },
    orderBy: { createdAt: 'asc' },
    select: LIST_SELECT,
    take: 200,
  });
  return itens.map(normalizarDatas);
}

/** Contadores do resumo do painel. */
export async function getAppointmentSummary(companyId) {
  if (!companyId) throw new Error('Resumo exige companyId.');

  const hoje = paraDate(todayIn(siteConfig.booking.timezone));
  const [pendentes, hojeConfirmados] = await Promise.all([
    prisma.appointment.count({
      where: { companyId, status: 'pending' },
    }),
    prisma.appointment.count({
      where: { companyId, status: 'confirmed', scheduledDate: hoje },
    }),
  ]);
  return { pendentes, hojeConfirmados };
}

/** Pedido completo, com histórico, para a tela de detalhe do painel. */
export async function getAppointmentDetail(companyId, id) {
  if (!companyId) throw new Error('Detalhe exige companyId.');

  const appointment = await prisma.appointment.findFirst({
    where: { id: String(id), companyId },
    include: {
      events: {
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!appointment) return null;
  return normalizarDatas(appointment);
}

/**
 * Aplica uma ação da equipe (confirmar, propor, recusar, cancelar, atendido,
 * não compareceu).
 *
 * A troca de status é um `updateMany` filtrado pelos status de origem
 * permitidos: se duas pessoas da equipe agem no mesmo pedido ao mesmo tempo,
 * a segunda encontra o status já mudado, nada é alterado e ela recebe erro —
 * em vez de, por exemplo, uma confirmar e a outra recusar por cima.
 */
export async function actOnAppointment({ companyId, actorId, id, input }) {
  if (!companyId) throw new Error('Ação exige companyId.');

  const { success, data, errors } = validateAppointmentAction(input);
  if (!success) throw invalido(errors);

  const acao = APPOINTMENT_ACTIONS[data.action];

  /*
   * Dia fechado pode ser confirmado — abrir um sábado extra é decisão da
   * empresa. Dia que já passou, não: é quase sempre erro de toque no
   * calendário, e o cliente receberia uma confirmação para ontem.
   */
  if (acao.needsSchedule && data.date < todayIn(siteConfig.booking.timezone)) {
    throw invalido({ date: 'Esse dia já passou.' });
  }

  return prisma.$transaction(async (tx) => {
    const atual = await tx.appointment.findFirst({
      where: { id: String(id), companyId },
      select: { id: true, status: true },
    });
    if (!atual) throw new BookingError('not_found', 'Pedido não encontrado.');

    if (!acao.from.includes(atual.status)) {
      throw new BookingError(
        'invalid_transition',
        'Essa ação não vale para a situação atual do pedido. Recarregue a página.',
      );
    }

    const mudanca = {
      status: acao.to,
      // A mensagem da última decisão é a que o cliente vê; ação sem mensagem
      // não apaga a anterior — só troca quando a equipe escreveu algo.
      ...(data.message ? { responseMessage: sanitize(data.message) } : {}),
      ...(acao.needsSchedule
        ? { scheduledDate: paraDate(data.date), scheduledTime: data.time }
        : {}),
    };

    const { count } = await tx.appointment.updateMany({
      where: { id: atual.id, companyId, status: { in: acao.from } },
      data: mudanca,
    });
    if (count === 0) {
      throw new BookingError(
        'invalid_transition',
        'Outra pessoa acabou de mudar este pedido. Recarregue a página.',
      );
    }

    await tx.appointmentEvent.create({
      data: {
        appointmentId: atual.id,
        actorId: actorId ?? null,
        eventType: APPOINTMENT_EVENTS.STATUS_CHANGED,
        fromValue: atual.status,
        toValue: acao.to,
        note: acao.needsSchedule
          ? `${data.date} ${data.time}${data.message ? ` — ${data.message}` : ''}`
          : (data.message ?? null),
      },
    });

    const atualizado = await tx.appointment.findUnique({
      where: { id: atual.id },
    });
    return normalizarDatas(atualizado);
  });
}
