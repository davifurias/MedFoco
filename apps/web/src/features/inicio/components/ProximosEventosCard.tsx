import { useRef, useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EventoItem } from '../../../components/EventoItem';
import type { CalendarEvent } from '../../../data/types';
import { UPCOMING_EVENTS_LIMIT } from '../utils/resumo';

interface Props {
  /** Todos os eventos futuros, já ordenados; o cartão exibe no máximo 5. */
  events: readonly CalendarEvent[];
  onDelete: (id: string) => Promise<void>;
}

export function ProximosEventosCard({ events, onDelete }: Props) {
  const [pending, setPending] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const visible = events.slice(0, UPCOMING_EVENTS_LIMIT);

  async function confirmDelete(id: string) {
    setPending(null);
    setError('');
    try {
      await onDelete(id);
      // O botão que abriu o diálogo sumiu com o evento: leva o foco para o título do cartão.
      titleRef.current?.focus();
    } catch {
      setError('Não foi possível excluir o evento. Tente novamente.');
    }
  }

  return (
    <section className="card" aria-labelledby="proximos-title">
      <h2 id="proximos-title" ref={titleRef} tabIndex={-1}>
        Próximos eventos
      </h2>
      {visible.length ? (
        <ul className="item-list">
          {visible.map((event) => (
            <EventoItem key={event.id} event={event} onDelete={setPending} />
          ))}
        </ul>
      ) : (
        <div className="empty">Nenhum evento futuro. Adicione na aba Agenda.</div>
      )}
      <div className="status" role="alert">
        {error}
      </div>
      {pending && (
        <ConfirmDialog
          title="Excluir evento?"
          message={`Tem certeza que deseja excluir o evento "${pending.title}"?`}
          confirmLabel="Excluir"
          onCancel={() => setPending(null)}
          onConfirm={() => confirmDelete(pending.id)}
        />
      )}
    </section>
  );
}
