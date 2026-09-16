import { NextResponse } from 'next/server';

/** Traduz um TeamError em resposta HTTP, com códigos estáveis para a tela. */
export function teamErrorResponse(error) {
  const status =
    {
      validation_error: 400,
      invalid_token: 400,
      already_active: 400,
      forbidden: 403,
      not_found: 404,
    }[error.code] ?? 422;

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
