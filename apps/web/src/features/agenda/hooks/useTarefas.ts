import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { NewTask, Task } from '../../../data/types';

/** Tarefas da Agenda, com criação, conclusão e exclusão. */
export function useTarefas() {
  const repository = useRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Depois de qualquer gravação, a carga inicial (se ainda não chegou) já está desatualizada.
  const changedRef = useRef(false);

  useEffect(() => {
    let active = true;
    repository
      .listTasks()
      .then((list) => {
        if (active && !changedRef.current) setTasks(list);
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);

  const reload = useCallback(async () => {
    changedRef.current = true;
    setTasks(await repository.listTasks());
    // A lista acabou de ser lida com sucesso: ela já está carregada e sem erro.
    setLoadError(false);
    setLoading(false);
  }, [repository]);

  const addTask = useCallback(
    async (task: NewTask) => {
      await repository.addTask(task);
      await reload();
    },
    [repository, reload],
  );

  const setTaskDone = useCallback(
    async (id: string, done: boolean) => {
      await repository.setTaskDone(id, done);
      await reload();
    },
    [repository, reload],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await repository.deleteTask(id);
      await reload();
    },
    [repository, reload],
  );

  return { tasks, loading, loadError, addTask, setTaskDone, deleteTask };
}
