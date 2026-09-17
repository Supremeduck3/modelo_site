import { Card } from 'antd';
import { notFound } from 'next/navigation';
import SubmissionFilters from '@/components/painel/SubmissionFilters';
import SubmissionsTable from '@/components/painel/SubmissionsTable';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { requireSessionUser } from '@/server/modules/auth/session';
import {
  listAllCategories,
  listAssignableUsers,
  listSubmissions,
} from '@/server/modules/submissions/management';

export const metadata = { robots: { index: false, follow: false } };

/** Depende da sessão e da query string: nunca pré-renderizada. */
export const dynamic = 'force-dynamic';

/**
 * Fila de trabalho da equipe.
 *
 * A sessão é exigida aqui, e não herdada do layout: é dela que sai o
 * `companyId` de todas as consultas, então a página não depende de o layout ter
 * verificado antes.
 */
export default async function ManifestacoesPage({ searchParams }) {
  const user = await requireSessionUser('/painel/manifestacoes');

  // Defesa em profundidade: hoje os três papéis veem manifestações, mas a
  // permissão existe e um papel futuro de menor privilégio chegaria aqui e
  // leria descrição, contato do visitante e nota interna.
  if (!can(user, PERMISSIONS.SUBMISSIONS_VIEW)) notFound();
  const params = await searchParams;

  const [data, categories, assignees] = await Promise.all([
    listSubmissions(user.companyId, params),
    listAllCategories(user.companyId),
    listAssignableUsers(user.companyId),
  ]);

  return (
    <Card>
      <SubmissionFilters
        categories={categories}
        assignees={assignees}
        filters={data.filters}
      />
      <SubmissionsTable data={data} />
    </Card>
  );
}
