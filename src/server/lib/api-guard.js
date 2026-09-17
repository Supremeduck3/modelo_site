import { NextResponse } from 'next/server';
import { can } from '@/lib/auth/permissions';
import { consumeGlobalRateLimit } from '@/server/lib/rate-limit';
import { getSessionUser } from '@/server/modules/auth/session';

/**
 * Porteiro das rotas privadas.
 *
 * Cada rota do painel chama isto e recebe `{ user }` ou uma resposta pronta
 * para devolver. A guarda do layout serve à navegação; a autorização de
 * verdade é esta, repetida em toda rota — uma requisição à API não passa por
 * layout nenhum.
 */
export async function requireApiPermission(permission) {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: { code: 'unauthorized', message: 'Sessão expirada.' } },
        { status: 401 },
      ),
    };
  }

  if (permission && !can(user, permission)) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: {
            code: 'forbidden',
            message: 'Seu perfil não permite esta ação.',
          },
        },
        { status: 403 },
      ),
    };
  }

  return { user, response: null };
}

/** Corpo JSON da requisição, ou uma resposta 400 pronta. */
export async function readJsonBody(request) {
  try {
    /*
     * Lê como texto e mede antes de parsear: o `Content-Length` pode faltar
     * (corpo `chunked`) ou mentir, e aí o teto anunciado não protege nada. O
     * limite real é o daqui.
     */
    const texto = await request.text();
    if (texto.length > MAX_BODY_BYTES) {
      return { body: null, response: payloadTooLarge() };
    }

    return { body: JSON.parse(texto), response: null };
  } catch {
    return {
      body: null,
      response: NextResponse.json(
        { error: { code: 'invalid_json', message: 'Requisição inválida.' } },
        { status: 400 },
      ),
    };
  }
}

/** Traduz um SubmissionError em resposta HTTP. */
export function submissionErrorResponse(error) {
  const status =
    { validation_error: 400, not_found: 404, forbidden: 403 }[error.code] ??
    422;

  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status },
  );
}

/** Resposta 429 no formato que todas as telas do projeto já tratam. */
export function rateLimitedResponse(mensagem, retryAfterSeconds) {
  return NextResponse.json(
    {
      error: {
        code: 'rate_limited',
        message: mensagem,
        retryAfterSeconds,
        details: { retryAfterSeconds },
      },
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds || 60) },
    },
  );
}

/**
 * Teto absoluto de uma rota pública, cobrado antes de ler o corpo.
 *
 * Existe porque a cota por cliente depende de um identificador que o próprio
 * cliente escreve no cabeçalho: quem manda um valor diferente por requisição
 * escapa dela. Este teto conta a rota inteira, então a inundação para mesmo sem
 * identificar ninguém.
 *
 * É cobrado antes do `request.json()` de propósito — parsear centenas de MB
 * antes de decidir se a requisição vale seria o próprio vetor de consumo.
 */
export function enforceRouteCeiling(rota, opcoes, mensagem) {
  const rate = consumeGlobalRateLimit(rota, opcoes);
  if (rate.allowed) return null;

  return rateLimitedResponse(mensagem, rate.retryAfterSeconds);
}

/**
 * Teto de tamanho do corpo.
 *
 * Route Handlers não têm o limite que o `bodyParser` antigo tinha, então sem
 * isto uma requisição anuncia 500 MB e a aplicação tenta materializar tudo. O
 * maior corpo legítimo do molde é uma manifestação com 5000 caracteres de
 * descrição, então 64 KB cobre com folga.
 */
export const MAX_BODY_BYTES = 64 * 1024;

function payloadTooLarge() {
  return NextResponse.json(
    {
      error: {
        code: 'payload_too_large',
        message: 'Requisição grande demais.',
      },
    },
    { status: 413 },
  );
}

/**
 * Recusa pelo tamanho anunciado, antes de ler qualquer byte.
 *
 * Cabeçalho ausente ou não numérico não libera nada: quem omite
 * `Content-Length` (ou manda `chunked`) só escapa desta checagem, e quem lê o
 * corpo conta os bytes de verdade em `readJsonBody`.
 */
export function rejectOversizedBody(request) {
  const anunciado = request.headers.get('content-length');
  if (anunciado === null) return null;

  const tamanho = Number(anunciado);
  if (!Number.isFinite(tamanho) || tamanho < 0) return payloadTooLarge();

  return tamanho > MAX_BODY_BYTES ? payloadTooLarge() : null;
}
