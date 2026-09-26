import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EventoItem } from '../../components/EventoItem';
import type { CalendarEvent } from '../../data/types';
import { useFocusRequest } from '../../shared/useFocusRequest';
import { FormNovoEvento } from './components/FormNovoEvento';
import { useEventos } from './hooks/useEventos';

const LIST_TITLE_ID = 'agenda-eventos-title';

export function EventosPage() {
  const { events, loading, loadError, addEvent, deleteEvent } = useEventos();
  const [pending, setPending] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState('');
  const focus = useFocusRequest();

  async function confirmDelete(id: string) {
    setPending(null);
    setError('');
    try {
      await deleteEvent(id);
      focus(LIST_TITLE_ID);
    } catch {
      setError('Não foi possível excluir o evento. Tente novamente.');
    }
  }

  return (
    <>
      <FormNovoEvento onSave={addEvent} />
      <section className="card" aria-labelledby={LIST_TITLE_ID}>
        <h2 id={LIST_TITLE_ID} tabIndex={-1}>
          Todos os eventos
        </h2>
        {loadError ? (
          <div className="empty" role="alert">
            Não foi possível carregar os eventos.
          </div>
        ) : loading ? null : events.length ? (
          <ul className="item-list">
            {events.map((event) => (
              <EventoItem key={event.id} event={event} onDelete={setPending} />
            ))}
          </ul>
        ) : (
          <div className="empty">Nenhum evento ainda.</div>
        )}
        <div className="status" role="alert">
          {error}
        </div>
      </section>
      {pending && (
        <ConfirmDialog
          title="Excluir evento?"
          message={`Tem certeza que deseja excluir o evento "${pending.title}"?`}
          confirmLabel="Excluir"
          onCancel={() => setPending(null)}
          onConfirm={() => confirmDelete(pending.id)}
        />
      )}
    </>
  );
}
