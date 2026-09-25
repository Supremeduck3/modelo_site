import { revalidatePath } from 'next/cache';

/**
 * Marca as páginas públicas que mostram a tabela para serem refeitas.
 *
 * A home é estática com revalidação periódica — foi o que manteve o LCP baixo.
 * Sem este aviso, um preço alterado no painel só apareceria no site quando o
 * período vencesse. Chamado de rota, `revalidatePath` refaz a página na
 * próxima visita, não na hora.
 */
export function revalidatePublicCatalog() {
  revalidatePath('/');
  revalidatePath('/agendar');
}
