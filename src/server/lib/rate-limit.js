/**
 * Rate limiting em memória para as rotas públicas de escrita.
 *
 * Cada implantação é uma instância independente e de baixo volume, então uma
 * janela deslizante em memória cobre o caso de uso. Se um dia a implantação
 * rodar em mais de um processo, este módulo é o ponto de troca por Redis —
 * nenhum chamador conhece a estrutura interna.
 */
const buckets = new Map();

/**
 * Teto de chaves rastreadas.
 *
 * Com identificador que o cliente influencia, um atacante criaria uma chave
 * nova por requisição e o mapa cresceria sem limite — o rate limiting viraria
 * o próprio vetor de consumo de memória. Ao estourar o teto, descartamos as
 * janelas mais antigas.
 */
const MAX_CHAVES = 5000;

/** Prefixo dos contadores de rota inteira; nunca são despejados. */
const PREFIXO_GLOBAL = 'global:';

/** Remove janelas expiradas e, se ainda estiver grande, as mais antigas. */
function cleanup(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size <= MAX_CHAVES) return;

  /*
   * O Map preserva a ordem de inserção, então as primeiras chaves são as
   * janelas mais antigas — descartá-las só devolve cota a quem já esperou.
   *
   * Menos as chaves de rota: elas são criadas no início da janela e ficam
   * entre as primeiras, então o despejo apagaria justamente o teto global.
   * Numa inundação com identificador falsificado — o cenário para o qual o
   * teto existe — cada requisição criava uma chave nova, disparava a limpeza,
   * apagava `global:<rota>` e o contador renascia em 1. O teto nunca era
   * alcançado.
   */
  const excedente = buckets.size - MAX_CHAVES;
  let removidas = 0;
  for (const key of buckets.keys()) {
    if (key.startsWith(PREFIXO_GLOBAL)) continue;
    buckets.delete(key);
    removidas += 1;
    if (removidas >= excedente) break;
  }
}

/**
 * Consome uma unidade da cota de `key`.
 * Devolve { allowed, remaining, retryAfterSeconds }.
 */
export function consumeRateLimit(key, { limit = 5, windowMs = 600_000 } = {}) {
  const now = Date.now();
  if (buckets.size > MAX_CHAVES) cleanup(now);

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

/**
 * Teto global de uma rota, independente de quem chama.
 *
 * A cota por cliente depende de identificar o cliente, e o identificador vem
 * de cabeçalho que o próprio cliente escreve: quem falsifica um valor diferente
 * a cada requisição zera aquela cota. Este teto é a rede embaixo — ele conta
 * requisições da rota inteira, então a inundação para mesmo sem saber de onde
 * vem.
 *
 * O número precisa ser generoso o suficiente para nunca alcançar uso real de um
 * negócio pequeno, e pequeno o suficiente para que a inundação não encha o
 * banco nem a caixa de entrada da equipe.
 */
export function consumeGlobalRateLimit(rota, opcoes) {
  return consumeRateLimit(`global:${rota}`, opcoes);
}
