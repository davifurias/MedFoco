import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { useFocusRequest } from '../shared/useFocusRequest';
import type { TextEntry } from '../shared/useTextEntries';

interface ListaDeIdeiasProps<T extends TextEntry> {
  titleId: string;
  title: string;
  entries: readonly T[];
  loading: boolean;
  loadError: boolean;
  emptyText: string;
  loadErrorText: string;
  /** Texto extra por item (ex.: a data). */
  meta?: (entry: T) => string;
  onDelete: (id: string) => Promise<void>;
}

const preview = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}…` : text);

/** Lista de ideias com exclusão confirmada. */
export function ListaDeIdeias<T extends TextEntry>({
  titleId,
  title,
  entries,
  loading,
  loadError,
  emptyText,
  loadErrorText,
  meta,
  onDelete,
}: ListaDeIdeiasProps<T>) {
  const [pending, setPending] = useState<T | null>(null);
  const [error, setError] = useState('');
  const focus = useFocusRequest();

  async function confirmDelete(id: string) {
    setPending(null);
    setError('');
    try {
      await onDelete(id);
      focus(titleId);
    } catch {
      setError('Não foi possível excluir a ideia. Tente novamente.');
    }
  }

  return (
    <section className="card" aria-labelledby={titleId}>
      <h2 id={titleId} tabIndex={-1}>
        {title}
      </h2>
      {loadError ? (
        <div className="empty" role="alert">
          {loadErrorText}
        </div>
      ) : loading ? null : entries.length ? (
        <ul className="ideia-list">
          {entries.map((entry) => (
            <li key={entry.id} className="item">
              <div className="ideia-info">
                <div className="ideia-texto">{entry.text}</div>
                {meta && <div className="meta">{meta(entry)}</div>}
              </div>
              <button
                type="button"
                className="del"
                aria-label={`Excluir ideia: ${preview(entry.text)}`}
                onClick={() => setPending(entry)}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">{emptyText}</div>
      )}
      <div className="status" role="alert">
        {error}
      </div>
      {pending && (
        <ConfirmDialog
          title="Excluir ideia?"
          message={`Tem certeza que deseja excluir esta ideia? "${preview(pending.text)}"`}
          confirmLabel="Excluir"
          onCancel={() => setPending(null)}
          onConfirm={() => confirmDelete(pending.id)}
        />
      )}
    </section>
  );
}
