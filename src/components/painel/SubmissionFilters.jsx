'use client';

import { Button, Input, Select, Switch } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';
import {
  SUBMISSION_PRIORITIES,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
} from '@/lib/submissions/constants';
import styles from './submission-filters.module.css';

const NOBODY_VALUE = 'nobody';

/**
 * Filtros da lista de manifestações.
 *
 * Não faz fetch: a lista é renderizada no servidor a partir da query string,
 * então este componente só lê/escreve a URL. Trocar qualquer filtro volta
 * para a página 1 — manter a página antiga poderia apontar para um resultado
 * que não existe mais no novo recorte.
 */
export default function SubmissionFilters({ categories, assignees, filters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;

  const [search, setSearch] = useState(filters.search ?? '');

  function pushParams(next) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    params.set('page', '1');
    router.push(`?${params.toString()}`);
  }

  function updateFilter(name, value) {
    pushParams({ [name]: value });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateFilter('search', search.trim());
  }

  function handleClear() {
    setSearch('');
    router.push('?');
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.type ||
      filters.priority ||
      filters.categoryId ||
      filters.assignedTo ||
      filters.archived,
  );

  return (
    <form className={styles.filters} onSubmit={handleSearchSubmit}>
      <div className={styles.field}>
        <label htmlFor={fieldId('search')} className={styles.label}>
          Buscar
        </label>
        <Input.Search
          id={fieldId('search')}
          placeholder="Protocolo ou assunto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={(value) => updateFilter('search', value.trim())}
          allowClear
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('status')} className={styles.label}>
          Situação
        </label>
        <Select
          id={fieldId('status')}
          allowClear
          placeholder="Todas"
          className={styles.select}
          value={filters.status || undefined}
          onChange={(value) => updateFilter('status', value)}
          onClear={() => updateFilter('status', undefined)}
          options={SUBMISSION_STATUSES}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('type')} className={styles.label}>
          Tipo
        </label>
        <Select
          id={fieldId('type')}
          allowClear
          placeholder="Todos"
          className={styles.select}
          value={filters.type || undefined}
          onChange={(value) => updateFilter('type', value)}
          onClear={() => updateFilter('type', undefined)}
          options={SUBMISSION_TYPES}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('priority')} className={styles.label}>
          Prioridade
        </label>
        <Select
          id={fieldId('priority')}
          allowClear
          placeholder="Todas"
          className={styles.select}
          value={filters.priority || undefined}
          onChange={(value) => updateFilter('priority', value)}
          onClear={() => updateFilter('priority', undefined)}
          options={SUBMISSION_PRIORITIES}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('categoryId')} className={styles.label}>
          Categoria
        </label>
        <Select
          id={fieldId('categoryId')}
          allowClear
          placeholder="Todas"
          className={styles.select}
          value={filters.categoryId || undefined}
          onChange={(value) => updateFilter('categoryId', value)}
          onClear={() => updateFilter('categoryId', undefined)}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('assignedTo')} className={styles.label}>
          Responsável
        </label>
        <Select
          id={fieldId('assignedTo')}
          allowClear
          placeholder="Todos"
          className={styles.select}
          value={filters.assignedTo || undefined}
          onChange={(value) => updateFilter('assignedTo', value)}
          onClear={() => updateFilter('assignedTo', undefined)}
          options={[
            { value: NOBODY_VALUE, label: 'Sem responsável' },
            ...assignees.map((assignee) => ({
              value: assignee.id,
              label: assignee.name,
            })),
          ]}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId('archived')} className={styles.label}>
          Arquivadas
        </label>
        <Switch
          id={fieldId('archived')}
          checked={filters.archived}
          onChange={(checked) =>
            updateFilter('archived', checked ? 'true' : undefined)
          }
        />
      </div>

      {hasActiveFilters && (
        <Button type="link" onClick={handleClear} className={styles.clear}>
          Limpar filtros
        </Button>
      )}
    </form>
  );
}
