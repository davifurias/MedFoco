import { useCallback, useEffect, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { CalendarEvent, NewCalendarEvent } from '../../../data/types';
import { sortEventsByDate } from '../utils/agenda';

/** Eventos da Agenda (todos, em ordem de data), com criação e exclusão. */
export function useEventos() {
  const repository = useRepository();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    repository
      .listEvents()
      .then((list) => active && setEvents(sortEventsByDate(list)))
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);

  const reload = useCallback(async () => {
    setEvents(sortEventsByDate(await repository.listEvents()));
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
