/**
 * Identifica o cliente de uma requisição, para fins de rate limiting.
 *
 * `X-Forwarded-For` é escrito pelo cliente. Aceitá-lo sem condição entrega o
 * rate limiting de graça: basta mandar um valor diferente por requisição para
 * cada cota "por cliente" começar do zero. Por isso ele só é lido quando a
 * implantação declara que existe um proxy confiável na frente
 * (`TRUSTED_PROXY=1`) — e, nesse caso, do fim para o começo, porque o proxy
 * anexa o endereço real no final e o começo continua sob controle de quem
 * chama.
 *
 * Isto nunca é identidade: não autoriza nada, só distribui cota.
 */

/** Diz se a implantação está atrás de proxy/CDN que reescreve o cabeçalho. */
function atrasDeProxyConfiavel() {
  const valor = process.env.TRUSTED_PROXY?.trim().toLowerCase();
  return valor === '1' || valor === 'true';
}

export function getClientIdentifier(request) {
  if (atrasDeProxyConfiavel()) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      // Último salto: é o que o proxy confiável acrescentou.
      const saltos = forwarded
        .split(',')
        .map((parte) => parte.trim())
        .filter(Boolean);
      if (saltos.length > 0) return saltos[saltos.length - 1];
    }

    const real = request.headers.get('x-real-ip')?.trim();
    if (real) return real;
  }

  // Sem proxy declarado, ainda usamos o cabeçalho como melhor esforço: ele
  // barra abuso casual e o visitante comum não o manipula. Quem falsifica
  // escapa desta cota de propósito — é para isso que existe o teto global da
  // rota (`consumeGlobalRateLimit`), que não depende de identificar ninguém.
  //
  // Fazer todos compartilharem uma única cota seria pior: bloquearia o terceiro
  // visitante legítimo da manhã.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const primeiro = forwarded.split(',')[0]?.trim();
    if (primeiro) return primeiro;
  }

  return request.headers.get('x-real-ip')?.trim() ?? 'desconhecido';
}
