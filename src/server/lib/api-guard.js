import { NextResponse } from 'next/server';
import { can } from '@/lib/auth/permissions';
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
    return { body: await request.json(), response: null };
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
