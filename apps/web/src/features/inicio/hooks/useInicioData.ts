import { useCallback, useEffect, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { CalendarEvent, DailySuggestion, FocusSession, Task } from '../../../data/types';

interface InicioData {
  tasks: Task[];
  events: CalendarEvent[];
  sessions: FocusSession[];
  suggestion: DailySuggestion | null;
}

const EMPTY: InicioData = { tasks: [], events: [], sessions: [], suggestion: null };

/** Dados e ações da tela Início, obtidos pelo repositório (sem acesso direto ao armazenamento). */
export function useInicioData() {
  const repository = useRepository();
  const [data, setData] = useState<InicioData>(EMPTY);

  useEffect(() => {
    let active = true;
    Promise.all([
      repository.listTasks(),
      repository.listEvents(),
      repository.listFocusSessions(),
      repository.getDailySuggestion(),
    ]).then(([tasks, events, sessions, suggestion]) => {
      if (active) setData({ tasks, events, sessions, suggestion });
    });
    return () => {
      active = false;
    };
  }, [repository]);

  const addTask = useCallback(
    async (title: string) => {
      await repository.addTask({
        title,
        subject: '',
        deadline: '',
        priority: 'média',
        done: false,
      });
      const tasks = await repository.listTasks();
      setData((d) => ({ ...d, tasks }));
    },
    [repository],
  );

  const addEvent = useCallback(
    async (title: string, date: string) => {
      await repository.addEvent({ title, date, category: 'outro', notes: '' });
      const events = await repository.listEvents();
      setData((d) => ({ ...d, events }));
    },
    [repository],
  );

  const addIdea = useCallback(
    async (text: string) => {
      await repository.addNotebookEntry({ text });
    },
    [repository],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await repository.deleteEvent(id);
      const events = await repository.listEvents();
      setData((d) => ({ ...d, events }));
    },
    [repository],
  );

  return { ...data, addTask, addEvent, addIdea, deleteEvent };
}
