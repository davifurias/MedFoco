import { useCallback, useEffect, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';

/** Horários fixos da semana (texto livre). */
export function useHorarios() {
  const repository = useRepository();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    repository
      .getSchedule()
      .then((value) => active && setText(value))
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);

  const save = useCallback(
    async (value: string) => {
      await repository.saveSchedule(value);
      setText(value);
    },
    [repository],
  );

  return { text, loading, loadError, save };
}
