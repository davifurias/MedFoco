import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { Material, NewMaterial } from '../../../data/types';

/** Materiais de estudo, com criação e exclusão. */
export function useMateriais() {
  const repository = useRepository();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Depois de qualquer gravação, a carga inicial (se ainda não chegou) já está desatualizada.
  const changedRef = useRef(false);

  useEffect(() => {
    let active = true;
    repository
      .listMaterials()
      .then((list) => {
        if (active && !changedRef.current) setMaterials(list);
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);

  const reload = useCallback(async () => {
    changedRef.current = true;
    setMaterials(await repository.listMaterials());
    // A lista acabou de ser lida com sucesso: ela já está carregada e sem erro.
    setLoadError(false);
    setLoading(false);
  }, [repository]);

  const addMaterial = useCallback(
    async (material: NewMaterial) => {
      await repository.addMaterial(material);
      await reload();
    },
    [repository, reload],
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      await repository.deleteMaterial(id);
      await reload();
    },
    [repository, reload],
  );

  return { materials, loading, loadError, addMaterial, deleteMaterial };
}
