import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { CalendarEvent, NewCalendarEvent } from '../../../data/types';
import { sortEventsByDate } from '../utils/agenda';

/** Eventos da Agenda (todos, em ordem de data), com criação e exclusão. */
export function useEventos() {
  const repository = useRepository();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Depois de qualquer gravação, a carga inicial (se ainda não chegou) já está desatualizada.
  const changedRef = useRef(false);

  useEffect(() => {
    let active = true;
    repository
      .listEvents()
      .then((list) => {
        if (active && !changedRef.current) setEvents(sortEventsByDate(list));
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);

  const reload = useCallback(async () => {
    changedRef.current = true;
    setEvents(sortEventsByDate(await repository.listEvents()));
    // A lista acabou de ser lida com sucesso: ela já está carregada e sem erro.
    setLoadError(false);
    setLoading(false);
  }, [repository]);

  const addEvent = useCallback(
    async (event: NewCalendarEvent) => {
      await repository.addEvent(event);
      await reload();
    },
    [repository, reload],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await repository.deleteEvent(id);
      await reload();
    },
    [repository, reload],
  );

  return { events, loading, loadError, addEvent, deleteEvent };
}
