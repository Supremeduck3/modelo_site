import { Card, Col, Descriptions, Row, Tag } from 'antd';
import { notFound } from 'next/navigation';
import SubmissionArchiveButton from '@/components/painel/SubmissionArchiveButton';
import SubmissionClassificationForm from '@/components/painel/SubmissionClassificationForm';
import SubmissionNoteForm from '@/components/painel/SubmissionNoteForm';
import SubmissionResponseForm from '@/components/painel/SubmissionResponseForm';
import SubmissionTimeline from '@/components/painel/SubmissionTimeline';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import {
  labelOf,
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
} from '@/lib/submissions/constants';
import { requireSessionUser } from '@/server/modules/auth/session';
import {
  getSubmissionDetail,
  listAllCategories,
  listAssignableUsers,
} from '@/server/modules/submissions/management';
import styles from './page.module.css';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/**
 * Detalhe de uma manifestação: conteúdo, contato, histórico e as três ações.
 *
 * Um id de outra empresa não é encontrado — e responde 404 igual a um id
 * inexistente, para não confirmar que o registro existe em algum lugar.
 */
export default async function ManifestacaoDetalhePage({ params }) {
  const { id } = await params;
  const user = await requireSessionUser(`/painel/manifestacoes/${id}`);

  // Defesa em profundidade: hoje os três papéis veem manifestações, mas a
  // permissão existe e um papel futuro de menor privilégio chegaria aqui e
  // leria descrição, contato do visitante e nota interna.
  if (!can(user, PERMISSIONS.SUBMISSIONS_VIEW)) notFound();

  const submission = await getSubmissionDetail(user.companyId, id);
  if (!submission) notFound();

  const [categories, assignees] = await Promise.all([
    listAllCategories(user.companyId),
    listAssignableUsers(user.companyId),
  ]);

  const canManage = can(user, PERMISSIONS.SUBMISSIONS_MANAGE);
  const canArchive = can(user, PERMISSIONS.SUBMISSIONS_ARCHIVE);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card title={submission.title} extra={<Tag>{submission.protocol}</Tag>}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="Tipo">
              {labelOf(SUBMISSION_TYPES, submission.type)}
            </Descriptions.Item>
            <Descriptions.Item label="Situação">
              {labelOf(SUBMISSION_STATUSES, submission.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Prioridade">
              {labelOf(SUBMISSION_PRIORITIES, submission.priority)}
            </Descriptions.Item>
            <Descriptions.Item label="Categoria">
              {submission.category?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Responsável">
              {submission.assignee?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Recebida em">
              {dateFormatter.format(submission.createdAt)}
            </Descriptions.Item>
          </Descriptions>

          {/*
            Parágrafo em markup próprio, e não `Typography.Paragraph`: num
            Server Component o antd chega por referência de cliente, e um
            subcomponente exposto como objeto (forwardRef) vem `undefined` daí
            — a página quebra em execução, não no build. Subcomponentes que são
            função simples, como `Descriptions.Item`, funcionam.
          */}
          <p className={styles.description}>{submission.description}</p>

          <Descriptions column={1} size="small" title="Contato informado">
            <Descriptions.Item label="Nome">
              {submission.contactName ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="E-mail">
              {submission.contactEmail ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Telefone">
              {submission.contactPhone ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Histórico" style={{ marginTop: 16 }}>
          <SubmissionTimeline
            events={submission.events}
            categories={categories}
          />
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="Classificação">
          <SubmissionClassificationForm
            submission={submission}
            categories={categories}
            assignees={assignees}
            canManage={canManage}
          />
        </Card>

        <Card title="Responder ao visitante" style={{ marginTop: 16 }}>
          <SubmissionResponseForm
            submission={submission}
            canManage={canManage}
          />
        </Card>

        <Card title="Nota interna" style={{ marginTop: 16 }}>
          <SubmissionNoteForm
            submissionId={submission.id}
            canManage={canManage}
          />
        </Card>

        {canArchive && (
          <Card title="Arquivo" style={{ marginTop: 16 }}>
            <SubmissionArchiveButton
              submission={submission}
              canArchive={canArchive}
            />
          </Card>
        )}
      </Col>
    </Row>
  );
}
