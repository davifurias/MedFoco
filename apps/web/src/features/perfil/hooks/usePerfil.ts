import { useCallback, useEffect, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { Profile } from '../../../data/types';

/** Perfil acadêmico salvo neste aparelho. */
export function usePerfil() {
  const repository = useRepository();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    repository
      .getProfile()
      .then((value) => active && setProfile(value))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [repository]);

  const save = useCallback(
    async (value: Profile) => {
      await repository.saveProfile(value);
      setProfile(value);
    },
    [repository],
  );

  return { profile, loadError, save };
}
