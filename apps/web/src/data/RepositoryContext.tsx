import { createContext, useContext, type ReactNode } from 'react';
import type { MedFocoRepository } from './repository';

const RepositoryContext = createContext<MedFocoRepository | null>(null);

export function RepositoryProvider({
  repository,
  children,
}: {
  repository: MedFocoRepository;
  children: ReactNode;
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): MedFocoRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) throw new Error('useRepository precisa estar dentro de <RepositoryProvider>');
  return repository;
}
