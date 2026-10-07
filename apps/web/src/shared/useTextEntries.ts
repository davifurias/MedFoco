import { useCallback, useEffect, useRef, useState } from 'react';

/** Itens de texto simples (ideias) que se pode adicionar e excluir. */
export interface TextEntry {
  id: string;
  text: string;
  createdAt: number;
}

interface TextEntrySource<T extends TextEntry> {
  list(): Promise<T[]>;
  add(text: string): Promise<unknown>;
  remove(id: string): Promise<void>;
}

/** Lista de ideias, com a mais recente primeiro (empate: a gravada por último). */
export function newestFirst<T extends TextEntry>(entries: readonly T[]): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.createdAt - a.entry.createdAt || b.index - a.index)
    .map(({ entry }) => entry);
}

export function useTextEntries<T extends TextEntry>(source: TextEntrySource<T>) {
  const [entries, setEntries] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Depois de qualquer gravação, a carga inicial (se ainda não chegou) já está desatualizada.
  const changedRef = useRef(false);

  useEffect(() => {
    let active = true;
    source
      .list()
      .then((list) => {
        if (active && !changedRef.current) setEntries(list);
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [source]);

  const reload = useCallback(async () => {
    changedRef.current = true;
    setEntries(await source.list());
    setLoadError(false);
    setLoading(false);
  }, [source]);

  const add = useCallback(
    async (text: string) => {
      await source.add(text);
      await reload();
    },
    [source, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await source.remove(id);
      await reload();
    },
    [source, reload],
  );

  return { entries: newestFirst(entries), loading, loadError, add, remove };
}
