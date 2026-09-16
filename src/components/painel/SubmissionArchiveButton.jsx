'use client';

import { App, Button, Popconfirm } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GENERIC_ERROR = 'Não foi possível concluir agora. Tente novamente.';

/**
 * Tira a manifestação da fila de trabalho, ou traz de volta.
 *
 * Arquivar não apaga: o registro e o histórico continuam no banco e voltam a
 * aparecer com o filtro "Arquivadas". Por isso a confirmação fala em arquivar,
 * e não em excluir.
 */
export default function SubmissionArchiveButton({ submission, canArchive }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  if (!canArchive) return null;

  const archived = Boolean(submission.archivedAt);

  async function handleClick() {
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch(
        `/api/painel/manifestacoes/${submission.id}/arquivo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: !archived }),
        },
      );

      if (response.ok) {
        message.success(
          archived ? 'Manifestação reaberta.' : 'Manifestação arquivada.',
        );
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      message.error(body?.error?.message ?? GENERIC_ERROR);
    } catch {
      message.error(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  }

  if (archived) {
    return (
      <Button onClick={handleClick} loading={saving}>
        Tirar do arquivo
      </Button>
    );
  }

  return (
    <Popconfirm
      title="Arquivar manifestação"
      description="Ela sai da fila de trabalho, mas continua registrada e pode voltar."
      okText="Arquivar"
      cancelText="Cancelar"
      onConfirm={handleClick}
    >
      <Button danger loading={saving}>
        Arquivar
      </Button>
    </Popconfirm>
  );
}
