import { NextResponse } from 'next/server';

/** Traduz um CompanyError em resposta HTTP, com códigos estáveis para a tela. */
export function companyErrorResponse(error) {
  const status =
    {
      validation_error: 400,
      category_in_use: 400,
      forbidden: 403,
      not_found: 404,
      duplicate: 409,
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
