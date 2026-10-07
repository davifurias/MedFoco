import { useEffect, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import { SECTIONS, type SearchData, type SectionKey } from '../utils/busca';

const EMPTY: SearchData = {
  eventos: [],
  materias: [],
  tarefas: [],
  questoes: [],
  ideiasApp: [],
  caderno: [],
};

/** Carrega todas as áreas pesquisadas; se uma falhar, as outras continuam funcionando. */
export function useBuscaData() {
  const repository = useRepository();
  const [data, setData] = useState<SearchData>(EMPTY);
  const [failed, setFailed] = useState<SectionKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loaders: Record<SectionKey, () => Promise<unknown>> = {
      eventos: () => repository.listEvents(),
      materias: () => repository.listMaterials(),
      tarefas: () => repository.listTasks(),
      questoes: () => repository.listQuestions(),
      ideiasApp: () => repository.listAppIdeas(),
      caderno: () => repository.listNotebookEntries(),
    };
    const keys = SECTIONS.map((section) => section.key);
    Promise.allSettled(
      keys.map(async (key) => {
        try {
          return await loaders[key]();
        } catch {
          throw new Error(key);
        }
      }),
    ).then((results) => {
      if (!active) return;
      const next: Record<string, unknown> = {};
      const bad: SectionKey[] = [];
      results.forEach((result, i) => {
        const key = keys[i] as SectionKey;
        if (result.status === 'fulfilled') next[key] = result.value;
        else bad.push(key);
      });
      setData({ ...EMPTY, ...(next as Partial<SearchData>) });
      setFailed(bad);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [repository]);

  return { data, failed, loading };
}
