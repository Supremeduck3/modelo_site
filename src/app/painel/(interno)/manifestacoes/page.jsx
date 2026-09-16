import { Card } from 'antd';
import SubmissionFilters from '@/components/painel/SubmissionFilters';
import SubmissionsTable from '@/components/painel/SubmissionsTable';
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
