'use client';

import {
  Alert,
  App,
  AutoComplete,
  Button,
  Empty,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Switch,
  Tag,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import {
  centsToInput,
  formatDuration,
  formatPrice,
} from '@/lib/catalog/format';
import { validateOffering } from '@/lib/catalog/schema';
import styles from './catalog-manager.module.css';
import { TAG_SOLIDO } from './tag-colors';

const GENERIC_ERROR = 'Não foi possível concluir agora. Tente novamente.';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  priceFrom: false,
  durationMinutes: null,
  description: '',
  bookable: true,
  isActive: true,
};

function toForm(offering) {
  return {
    name: offering.name,
    category: offering.category ?? '',
    price: centsToInput(offering.priceCents),
    priceFrom: offering.priceFrom,
    durationMinutes: offering.durationMinutes,
    description: offering.description ?? '',
    bookable: offering.bookable,
    isActive: offering.isActive,
  };
}

/**
 * Tabela de serviços e preços no painel.
 *
 * Lista em cartões, não tabela: quem atualiza preço de salão faz isso do
 * celular, entre um cliente e outro. Cada cartão diz o que o site mostra
 * (preço formatado, duração) em vez do número cru gravado no banco.
 */
export default function CatalogManager({ offerings, canManage }) {
  const router = useRouter();
  const { message } = App.useApp();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [editing, setEditing] = useState(null); // null | 'new' | offering
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Categorias já usadas viram sugestão: evita "Cabelo" e "cabelos" como
  // dois grupos diferentes na tabela pública.
  const categoryOptions = useMemo(
    () =>
      [...new Set(offerings.map((item) => item.category).filter(Boolean))].map(
        (value) => ({ value }),
      ),
    [offerings],
  );

  function openNew() {
    setEditing('new');
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError('');
  }

  function openEdit(offering) {
    setEditing(offering);
    setForm(toForm(offering));
    setErrors({});
    setFormError('');
  }

  function close() {
    if (saving) return;
    setEditing(null);
  }

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    if (saving) return;
    setFormError('');

    const result = validateOffering(form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);

    const isNew = editing === 'new';

    try {
      const response = await fetch(
        isNew ? '/api/painel/servicos' : `/api/painel/servicos/${editing.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          // Envia o preço como foi digitado: quem converte é o servidor, com o
          // mesmo leitor que validou aqui.
          body: JSON.stringify(form),
        },
      );

      if (response.ok) {
        message.success(isNew ? 'Serviço criado.' : 'Serviço atualizado.');
        setEditing(null);
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      if (body?.error?.details) setErrors(body.error.details);
      setFormError(body?.error?.message ?? GENERIC_ERROR);
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function request(id, url, options, sucesso) {
    setBusyId(id);
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        if (sucesso) message.success(sucesso);
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

  const move = (item, direction) =>
    request(item.id, `/api/painel/servicos/${item.id}/mover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });

  const remove = (item) =>
    request(
      item.id,
      `/api/painel/servicos/${item.id}`,
      { method: 'DELETE' },
      'Serviço excluído.',
    );

  const toggleActive = (item) =>
    request(
      item.id,
      `/api/painel/servicos/${item.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...toForm(item), isActive: !item.isActive }),
      },
      item.isActive ? 'Serviço escondido do site.' : 'Serviço visível no site.',
    );

  return (
    <div className={styles.root}>
      <p className={styles.intro}>
        O que estiver ativo aparece na tabela de preços do site
        {canManage ? ', na ordem desta lista.' : '.'} Serviços marcados como
        agendáveis podem ser escolhidos no pedido de agendamento.
      </p>

      {canManage && (
        <Button type="primary" onClick={openNew} className={styles.newButton}>
          Novo serviço
        </Button>
      )}

      {offerings.length === 0 ? (
        <Empty description="Nenhum serviço cadastrado ainda." />
      ) : (
        <ul className={styles.list}>
          {offerings.map((item, index) => (
            <li
              key={item.id}
              className={`${styles.item} ${item.isActive ? '' : styles.inactive}`}
            >
              <div className={styles.main}>
                <div className={styles.titleRow}>
                  <h3 className={styles.name}>{item.name}</h3>
                  <span className={styles.price}>
                    {formatPrice(item.priceCents, item.priceFrom)}
                  </span>
                </div>
                <div className={styles.meta}>
                  {item.category && <span>{item.category}</span>}
                  {formatDuration(item.durationMinutes) && (
                    <span>{formatDuration(item.durationMinutes)}</span>
                  )}
                  {!item.isActive && (
                    <Tag color={TAG_SOLIDO.cinza}>Fora do site</Tag>
                  )}
                  {item.isActive && !item.bookable && (
                    <Tag color={TAG_SOLIDO.laranja}>Não agendável</Tag>
                  )}
                </div>
                {item.description && (
                  <p className={styles.description}>{item.description}</p>
                )}
              </div>

              {canManage && (
                <div className={styles.actions}>
                  <Button
                    size="small"
                    onClick={() => move(item, 'up')}
                    disabled={index === 0 || busyId === item.id}
                    aria-label={`Subir ${item.name}`}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    onClick={() => move(item, 'down')}
                    disabled={
                      index === offerings.length - 1 || busyId === item.id
                    }
                    aria-label={`Descer ${item.name}`}
                  >
                    ↓
                  </Button>
                  <Button size="small" onClick={() => openEdit(item)}>
                    Editar
                  </Button>
                  <Button
                    size="small"
                    onClick={() => toggleActive(item)}
                    loading={busyId === item.id}
                  >
                    {item.isActive ? 'Esconder' : 'Mostrar'}
                  </Button>
                  <Popconfirm
                    title="Excluir serviço"
                    description="Pedidos de agendamento antigos continuam mostrando o nome do serviço."
                    okText="Excluir"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancelar"
                    onConfirm={() => remove(item)}
                  >
                    <Button
                      size="small"
                      type="text"
                      danger
                      disabled={busyId === item.id}
                    >
                      Excluir
                    </Button>
                  </Popconfirm>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Novo serviço' : 'Editar serviço'}
        onCancel={close}
        onOk={handleSave}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={saving}
        destroyOnHidden
      >
        <div className={styles.form}>
          {formError && <Alert type="error" message={formError} showIcon />}

          <div className={styles.field}>
            <label htmlFor={fieldId('name')}>Nome</label>
            <Input
              id={fieldId('name')}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              status={errors.name ? 'error' : undefined}
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? fieldId('name-e') : undefined}
              placeholder="Corte feminino"
              maxLength={80}
            />
            {errors.name && (
              <p id={fieldId('name-e')} className={styles.error}>
                {errors.name}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={fieldId('category')}>Categoria (opcional)</label>
            <AutoComplete
              id={fieldId('category')}
              value={form.category}
              options={categoryOptions}
              onChange={(value) => update('category', value ?? '')}
              placeholder="Cabelo, Unhas, Barba…"
              filterOption={(input, option) =>
                option.value.toLowerCase().includes(input.toLowerCase())
              }
            />
            {errors.category && (
              <p className={styles.error}>{errors.category}</p>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor={fieldId('price')}>Preço</label>
              <Input
                id={fieldId('price')}
                prefix="R$"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                status={errors.price ? 'error' : undefined}
                aria-invalid={errors.price ? 'true' : undefined}
                aria-describedby={fieldId('price-h')}
                placeholder="45,00"
              />
              <p id={fieldId('price-h')} className={styles.hint}>
                Vazio = “sob consulta”.
              </p>
              {errors.price && <p className={styles.error}>{errors.price}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor={fieldId('duration')}>Duração (min)</label>
              <InputNumber
                id={fieldId('duration')}
                min={5}
                max={600}
                step={5}
                inputMode="numeric"
                value={form.durationMinutes}
                onChange={(value) => update('durationMinutes', value)}
                status={errors.durationMinutes ? 'error' : undefined}
                placeholder="40"
                style={{ width: '100%' }}
              />
              {errors.durationMinutes && (
                <p className={styles.error}>{errors.durationMinutes}</p>
              )}
            </div>
          </div>

          <div className={styles.switch}>
            <Switch
              id={fieldId('priceFrom')}
              checked={form.priceFrom}
              onChange={(value) => update('priceFrom', value)}
              size="small"
            />
            <label htmlFor={fieldId('priceFrom')}>
              Mostrar “a partir de” antes do preço
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor={fieldId('description')}>Descrição (opcional)</label>
            <Input.TextArea
              id={fieldId('description')}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              autoSize={{ minRows: 2, maxRows: 5 }}
              maxLength={300}
              showCount
            />
            {errors.description && (
              <p className={styles.error}>{errors.description}</p>
            )}
          </div>

          <div className={styles.switch}>
            <Switch
              id={fieldId('bookable')}
              checked={form.bookable}
              onChange={(value) => update('bookable', value)}
              size="small"
            />
            <label htmlFor={fieldId('bookable')}>
              Pode ser escolhido no agendamento
            </label>
          </div>

          <div className={styles.switch}>
            <Switch
              id={fieldId('isActive')}
              checked={form.isActive}
              onChange={(value) => update('isActive', value)}
              size="small"
            />
            <label htmlFor={fieldId('isActive')}>Aparece no site</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
