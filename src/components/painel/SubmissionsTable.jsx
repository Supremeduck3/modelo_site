'use client';

import { Empty, Table, Tag } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  labelOf,
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
} from '@/lib/submissions/constants';
import { TAG_SOLIDO } from './tag-colors';

const STATUS_COLOR = {
  new: TAG_SOLIDO.azul,
  in_review: TAG_SOLIDO.laranja,
  in_progress: TAG_SOLIDO.roxo,
  waiting_customer: TAG_SOLIDO.laranja,
  resolved: TAG_SOLIDO.verde,
  closed: TAG_SOLIDO.cinza,
};

const PRIORITY_COLOR = {
  low: TAG_SOLIDO.cinza,
  normal: TAG_SOLIDO.azul,
  high: TAG_SOLIDO.laranja,
  urgent: TAG_SOLIDO.vermelho,
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Lista de manifestações. Puramente controlada pela URL: a página não guarda
 * estado próprio de paginação porque quem sabe os dados corretos é o servidor
 * (via searchParams), e recarregar a página tem que mostrar a mesma coisa.
 */
export default function SubmissionsTable({ data }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => key !== 'page' && key !== 'pageSize',
  );

  function handlePageChange(page) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  }

  const columns = [
    {
      title: 'Protocolo',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol, record) => (
        <Link href={`/painel/manifestacoes/${record.id}`}>{protocol}</Link>
      ),
    },
    {
      title: 'Assunto',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type) => labelOf(SUBMISSION_TYPES, type),
    },
    {
      title: 'Situação',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLOR[status] ?? TAG_SOLIDO.cinza}>
          {labelOf(SUBMISSION_STATUSES, status)}
        </Tag>
      ),
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={PRIORITY_COLOR[priority] ?? TAG_SOLIDO.cinza}>
          {labelOf(SUBMISSION_PRIORITIES, priority)}
        </Tag>
      ),
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category?.name ?? '—',
    },
    {
      title: 'Responsável',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee) => assignee?.name ?? '—',
    },
    {
      title: 'Recebida em',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => formatDate(value),
    },
  ];

  if (data.total === 0) {
    return (
      <Empty
        description={
          hasActiveFilters
            ? 'Nenhuma manifestação encontrada com esses filtros.'
            : 'Nenhuma manifestação recebida ainda.'
        }
      />
    );
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data.items}
      scroll={{ x: true }}
      onRow={(record) => ({
        onClick: () => router.push(`/painel/manifestacoes/${record.id}`),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        current: data.page,
        total: data.total,
        pageSize: data.pageSize,
        showSizeChanger: false,
        onChange: handlePageChange,
      }}
    />
  );
}
