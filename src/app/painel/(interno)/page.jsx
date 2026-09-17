import { Card, Col, Row, Statistic } from 'antd';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { SUBMISSION_STATUSES } from '@/lib/submissions/constants';
import { requireSessionUser } from '@/server/modules/auth/session';
import { getSubmissionSummary } from '@/server/modules/submissions/service';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

/**
 * Início do painel: o quadro geral do canal de manifestações.
 *
 * A sessão é exigida de novo aqui, e não herdada do layout: é dela que sai o
 * `companyId` usado no filtro, então a página não depende de o layout ter
 * verificado antes.
 */
export default async function PanelHomePage() {
  const user = await requireSessionUser();

  // Defesa em profundidade: hoje os três papéis veem manifestações, mas a
  // permissão existe e um papel futuro de menor privilégio chegaria aqui e
  // leria descrição, contato do visitante e nota interna.
  if (!can(user, PERMISSIONS.SUBMISSIONS_VIEW)) notFound();
  const summary = await getSubmissionSummary(user.companyId);

  return (
    <div className={styles.page}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Manifestações recebidas" value={summary.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Em aberto" value={summary.open} />
          </Card>
        </Col>
      </Row>

      <Card title="Por situação">
        <Row gutter={[16, 16]}>
          {SUBMISSION_STATUSES.map((status) => (
            <Col key={status.value} xs={12} md={8} lg={4}>
              <Statistic
                title={status.label}
                value={summary.byStatus[status.value] ?? 0}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <Link href="/painel/manifestacoes">Ver todas as manifestações</Link>
      </Card>
    </div>
  );
}
