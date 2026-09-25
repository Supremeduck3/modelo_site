import { Card, Col, Row, Statistic } from 'antd';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { features } from '@/config/site';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { SUBMISSION_STATUSES } from '@/lib/submissions/constants';
import { requireSessionUser } from '@/server/modules/auth/session';
import { getAppointmentSummary } from '@/server/modules/booking/service';
import { getSubmissionSummary } from '@/server/modules/submissions/service';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

/**
 * Início do painel: a agenda (quando ligada) e o quadro geral do canal de
 * manifestações.
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
  const mostrarAgenda =
    features.booking && can(user, PERMISSIONS.APPOINTMENTS_VIEW);

  const [summary, agenda] = await Promise.all([
    getSubmissionSummary(user.companyId),
    mostrarAgenda ? getAppointmentSummary(user.companyId) : null,
  ]);

  return (
    <div className={styles.page}>
      {/* A agenda vem primeiro quando existe: pedido esperando resposta é o
          que tem prazo — o cliente está aguardando para saber se vem. */}
      {agenda && (
        <Row gutter={[16, 16]}>
          <Col xs={12}>
            <Link href="/painel/agenda" className={styles.cardLink}>
              <Card hoverable>
                <Statistic
                  title="Pedidos a responder"
                  value={agenda.pendentes}
                />
              </Card>
            </Link>
          </Col>
          <Col xs={12}>
            <Link
              href="/painel/agenda?ver=proximos"
              className={styles.cardLink}
            >
              <Card hoverable>
                <Statistic
                  title="Horários hoje"
                  value={agenda.hojeConfirmados}
                />
              </Card>
            </Link>
          </Col>
        </Row>
      )}

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
