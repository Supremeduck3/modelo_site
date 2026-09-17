'use client';

import {
  Alert,
  App,
  Button,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { validateCategory } from '@/lib/company/schema';
import { TAG_SOLIDO } from './tag-colors';

const GENERIC_ERROR = 'Não foi possível concluir agora. Tente novamente.';

const INITIAL_FORM = { name: '', description: '' };

/**
 * Gestão de categorias das manifestações. Desativar uma categoria só a tira
 * do formulário público: as manifestações já classificadas com ela continuam
 * como estão. Excluir só é possível quando não há nenhuma manifestação
 * vinculada — assim o histórico nunca fica órfão.
 */
export default function CategoriesManager({ categories, canManage }) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value ?? '' }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');

    const result = validateCategory(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/painel/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (response.status === 201) {
        setForm(INITIAL_FORM);
        message.success('Categoria criada.');
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      const error = body?.error;

      if (response.status === 400 && error?.details) {
        setErrors(error.details);
      }

      setFormError(error?.details?.form ?? error?.message ?? GENERIC_ERROR);
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(record) {
    setEditing(record);
    setEditForm({ name: record.name, description: record.description ?? '' });
    setEditErrors({});
    setEditError('');
  }

  function closeEdit() {
    if (editSubmitting) return;
    setEditing(null);
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (editSubmitting || !editing) return;

    setEditError('');

    const result = validateCategory(editForm);
    if (!result.success) {
      setEditErrors(result.errors);
      return;
    }

    setEditErrors({});
    setEditSubmitting(true);

    try {
      const response = await fetch(`/api/painel/categorias/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (response.ok) {
        message.success('Categoria atualizada.');
        setEditing(null);
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      const error = body?.error;

      if (response.status === 400 && error?.details) {
        setEditErrors(error.details);
      }

      setEditError(error?.details?.form ?? error?.message ?? GENERIC_ERROR);
    } catch {
      setEditError(GENERIC_ERROR);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleActiveChange(record, isActive) {
    setBusyId(record.id);
    try {
      const response = await fetch(`/api/painel/categorias/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        message.success(
          isActive
            ? 'Categoria ativada: volta a aparecer no formulário público.'
            : 'Categoria desativada: não aparece mais no formulário público.',
        );
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      message.error(body?.error?.message ?? GENERIC_ERROR);
    } catch {
      message.error(GENERIC_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(record) {
    setBusyId(record.id);
    try {
      const response = await fetch(`/api/painel/categorias/${record.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Categoria excluída.');
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      message.error(body?.error?.message ?? GENERIC_ERROR);
    } catch {
      message.error(GENERIC_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
      render: (value) => value || '—',
    },
    {
      title: 'Situação',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? TAG_SOLIDO.verde : TAG_SOLIDO.cinza}>
          {isActive ? 'Ativa' : 'Inativa'}
        </Tag>
      ),
    },
    {
      title: 'Manifestações',
      dataIndex: 'submissionCount',
      key: 'submissionCount',
    },
  ];

  if (canManage) {
    columns.push({
      title: 'Ações',
      key: 'actions',
      render: (_, record) => {
        const isBusy = busyId === record.id;
        const canDelete = record.submissionCount === 0;

        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              size="small"
              onClick={() => openEdit(record)}
              disabled={isBusy}
            >
              Editar
            </Button>

            {record.isActive ? (
              <Popconfirm
                title="Desativar categoria"
                description="Ela some do formulário público, mas as manifestações já classificadas com ela continuam como estão."
                okText="Desativar"
                cancelText="Cancelar"
                onConfirm={() => handleActiveChange(record, false)}
              >
                <Button size="small" loading={isBusy}>
                  Desativar
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="Ativar categoria"
                description="Ela volta a aparecer no formulário público."
                okText="Ativar"
                cancelText="Cancelar"
                onConfirm={() => handleActiveChange(record, true)}
              >
                <Button size="small" loading={isBusy}>
                  Ativar
                </Button>
              </Popconfirm>
            )}

            {canDelete ? (
              <Popconfirm
                title="Excluir categoria"
                description="Esta ação não pode ser desfeita."
                okText="Excluir"
                okButtonProps={{ danger: true }}
                cancelText="Cancelar"
                onConfirm={() => handleDelete(record)}
              >
                <Button size="small" danger loading={isBusy}>
                  Excluir
                </Button>
              </Popconfirm>
            ) : (
              // Botão desabilitado com explicação no Tooltip, em vez de um
              // parágrafo na célula: a ação continua visível e a linha não
              // estica no celular.
              <Tooltip title="Já usada em manifestações. Desative em vez de excluir, para não apagar a classificação do que já foi atendido.">
                <Button size="small" danger disabled>
                  Excluir
                </Button>
              </Tooltip>
            )}
          </div>
        );
      },
    });
  }

  return (
    <>
      {canManage && (
        <form onSubmit={handleCreate} noValidate style={{ marginBottom: 24 }}>
          {formError && (
            <Alert
              type="error"
              message={formError}
              showIcon
              role="alert"
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
            <div>
              <label htmlFor={fieldId('name')}>Nome da categoria</label>
              <Input
                id={fieldId('name')}
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                status={errors.name ? 'error' : undefined}
                aria-describedby={
                  errors.name ? `${fieldId('name')}-error` : undefined
                }
                aria-invalid={errors.name ? 'true' : undefined}
              />
              {errors.name && (
                <p id={`${fieldId('name')}-error`} role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fieldId('description')}>
                Descrição (opcional)
              </label>
              <Input
                id={fieldId('description')}
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                status={errors.description ? 'error' : undefined}
                aria-describedby={
                  errors.description
                    ? `${fieldId('description')}-error`
                    : undefined
                }
                aria-invalid={errors.description ? 'true' : undefined}
              />
              {errors.description && (
                <p id={`${fieldId('description')}-error`} role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <Button type="primary" htmlType="submit" loading={submitting}>
              Criar categoria
            </Button>
          </div>
        </form>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={categories}
        scroll={{ x: true }}
        pagination={false}
      />

      <Modal
        open={Boolean(editing)}
        title="Editar categoria"
        onCancel={closeEdit}
        footer={null}
        destroyOnClose
      >
        <form onSubmit={handleEditSubmit} noValidate>
          {editError && (
            <Alert
              type="error"
              message={editError}
              showIcon
              role="alert"
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor={fieldId('edit-name')}>Nome</label>
              <Input
                id={fieldId('edit-name')}
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, name: event.target.value }))
                }
                status={editErrors.name ? 'error' : undefined}
                aria-describedby={
                  editErrors.name ? `${fieldId('edit-name')}-error` : undefined
                }
                aria-invalid={editErrors.name ? 'true' : undefined}
              />
              {editErrors.name && (
                <p id={`${fieldId('edit-name')}-error`} role="alert">
                  {editErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fieldId('edit-description')}>Descrição</label>
              <Input
                id={fieldId('edit-description')}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                status={editErrors.description ? 'error' : undefined}
                aria-describedby={
                  editErrors.description
                    ? `${fieldId('edit-description')}-error`
                    : undefined
                }
                aria-invalid={editErrors.description ? 'true' : undefined}
              />
              {editErrors.description && (
                <p id={`${fieldId('edit-description')}-error`} role="alert">
                  {editErrors.description}
                </p>
              )}
            </div>

            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <Button onClick={closeEdit} disabled={editSubmitting}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={editSubmitting}>
                Salvar
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
