/**
 * Rate limiting em memória para as rotas públicas de escrita.
 *
 * Cada implantação é uma instância independente e de baixo volume, então uma
 * janela deslizante em memória cobre o caso de uso. Se um dia a implantação
 * rodar em mais de um processo, este módulo é o ponto de troca por Redis —
 * nenhum chamador conhece a estrutura interna.
 */
const buckets = new Map();

/** Remove janelas expiradas para o mapa não crescer sem limite. */
function cleanup(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Consome uma unidade da cota de `key`.
 * Devolve { allowed, remaining, retryAfterSeconds }.
 */
export function consumeRateLimit(key, { limit = 5, windowMs = 600_000 } = {}) {
  const now = Date.now();
  if (buckets.size > 1000) cleanup(now);

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterSeconds: 0,
  };
}

/** Usado pelos testes para isolar cenários. */
export function resetRateLimit() {
  buckets.clear();
}
