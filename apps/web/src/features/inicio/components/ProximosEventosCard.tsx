import { useState } from 'react';
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
  const visible = events.slice(0, UPCOMING_EVENTS_LIMIT);

  return (
    <section className="card" aria-labelledby="proximos-title">
      <h2 id="proximos-title">Próximos eventos</h2>
      {visible.length ? (
        <ul className="item-list">
          {visible.map((event) => (
            <EventoItem key={event.id} event={event} onDelete={setPending} />
          ))}
        </ul>
      ) : (
        <div className="empty">Nenhum evento futuro. Adicione na aba Agenda.</div>
      )}
      {pending && (
        <ConfirmDialog
          title="Excluir evento?"
          message={`Tem certeza que deseja excluir o evento "${pending.title}"?`}
          confirmLabel="Excluir"
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            const { id } = pending;
            setPending(null);
            await onDelete(id);
          }}
        />
      )}
    </section>
  );
}
