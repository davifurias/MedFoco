import type { CalendarEvent } from '../data/types';
import { formatShortDate } from '../shared/date';
import { CategoriaPill } from './CategoriaPill';

interface EventoItemProps {
  event: CalendarEvent;
  onDelete: (event: CalendarEvent) => void;
}

/** Linha de evento: categoria, título, data · observação e botão de excluir. */
export function EventoItem({ event, onDelete }: EventoItemProps) {
  return (
    <li className="item">
      <div>
        <CategoriaPill category={event.category} />
        <div className="item-title">{event.title}</div>
        <div className="meta">
          {formatShortDate(event.date)}
          {event.notes ? ` · ${event.notes}` : ''}
        </div>
      </div>
      <button
        type="button"
        className="del"
        aria-label={`Excluir evento ${event.title}`}
        onClick={() => onDelete(event)}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </li>
  );
}
