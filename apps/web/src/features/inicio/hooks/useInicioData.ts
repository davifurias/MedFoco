import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { CalendarEvent, DailySuggestion, Task } from '../../../data/types';
import { useFoco } from '../../foco/FocoContext';

interface InicioData {
  tasks: Task[];
  events: CalendarEvent[];
  suggestion: DailySuggestion | null;
}

type Part = keyof InicioData;

const EMPTY: InicioData = { tasks: [], events: [], suggestion: null };

const PART_LABELS: Record<Part | 'sessions', string> = {
  tasks: 'tarefas',
  events: 'eventos',
  suggestion: 'sugestão do dia',
  sessions: 'minutos de foco',
};

/**
 * Dados e ações da tela Início, obtidos pelo repositório (sem acesso direto ao armazenamento).
 * As sessões de foco vêm do Foco, que as mantém atualizadas mesmo com o timer rodando em segundo
 * plano: assim, "min estudados hoje" muda na hora quando uma fase termina com o Início aberto.
 */
export function useInicioData() {
  const repository = useRepository();
  const { sessions, sessionsLoadError } = useFoco();
  const [data, setData] = useState<InicioData>(EMPTY);
  const [failed, setFailed] = useState<Part[]>([]);
  // Partes já alteradas pelo usuário: a carga inicial, se chegar depois, não as sobrescreve.
  const changed = useRef<Set<Part>>(new Set());

  useEffect(() => {
    let active = true;
    const loaders: { [K in Part]: () => Promise<InicioData[K]> } = {
      tasks: () => repository.listTasks(),
      events: () => repository.listEvents(),
      suggestion: () => repository.getDailySuggestion(),
    };
    const parts = Object.keys(loaders) as Part[];
    Promise.allSettled(parts.map((part) => loaders[part]())).then((results) => {
      if (!active) return;
      const loaded: Partial<InicioData> = {};
      const bad: Part[] = [];
      results.forEach((result, i) => {
        const part = parts[i] as Part;
        if (result.status === 'fulfilled') {
          if (!changed.current.has(part)) Object.assign(loaded, { [part]: result.value });
        } else {
          bad.push(part);
        }
      });
      setData((current) => ({ ...current, ...loaded }));
      setFailed(bad);
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
      changed.current.add('tasks');
      const tasks = await repository.listTasks();
      setData((d) => ({ ...d, tasks }));
    },
    [repository],
  );

  const addEvent = useCallback(
    async (title: string, date: string) => {
      await repository.addEvent({ title, date, category: 'outro', notes: '' });
      changed.current.add('events');
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
      changed.current.add('events');
      const events = await repository.listEvents();
      setData((d) => ({ ...d, events }));
    },
    [repository],
  );

  const failedLabels = [...failed, ...(sessionsLoadError ? (['sessions'] as const) : [])].map(
    (part) => PART_LABELS[part],
  );

  return { ...data, sessions, failedLabels, addTask, addEvent, addIdea, deleteEvent };
}
