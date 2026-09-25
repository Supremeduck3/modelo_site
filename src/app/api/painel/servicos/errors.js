import { NextResponse } from 'next/server';

const STATUS = { validation_error: 400, not_found: 404 };

/** Traduz um CatalogError em resposta HTTP. */
export function catalogErrorResponse(error) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: STATUS[error.code] ?? 422 },
  );
}

/** Erro inesperado: log no servidor, mensagem genérica para a tela. */
export function internalError(contexto, error) {
  console.error(`[painel] ${contexto}`, error);
  return NextResponse.json(
    {
      error: {
        code: 'internal_error',
        message: 'Não foi possível salvar agora. Tente novamente.',
      },
    },
    { status: 500 },
  );
}
