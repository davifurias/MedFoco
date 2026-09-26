import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createLocalRepository, createMemoryStorage } from '../../../data/localRepository';
import type { MedFocoRepository } from '../../../data/repository';
import { RepositoryProvider } from '../../../data/RepositoryContext';
import { useEventos } from './useEventos';
import { useTarefas } from './useTarefas';

afterEach(cleanup);

/**
 * Repositório cuja PRIMEIRA leitura de cada lista só termina quando o teste mandar. Simula um
 * backend lento: a carga inicial pode chegar depois de uma gravação feita pelo usuário.
 */
function withSlowFirstRead(repo: MedFocoRepository) {
  const gates: Record<string, () => void> = {};
  const slow = <T,>(name: string, read: () => Promise<T>) => {
    let first = true;
    return async () => {
      if (first) {
        first = false;
        const stale = await read(); // lê o estado ANTIGO agora…
        await new Promise<void>((resolve) => (gates[name] = resolve)); // …e só entrega depois
        return stale;
      }
      return read();
    };
  };
  return {
    repo: {
      ...repo,
      listTasks: slow('tasks', () => repo.listTasks()),
      listEvents: slow('events', () => repo.listEvents()),
    } satisfies MedFocoRepository,
    release: (name: string) => gates[name]?.(),
  };
}

const wrapperFor =
  (repository: MedFocoRepository) =>
  ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repository}>{children}</RepositoryProvider>
  );

describe('carga inicial lenta não sobrescreve gravações recentes', () => {
  it('tarefas', async () => {
    const { repo, release } = withSlowFirstRead(createLocalRepository(createMemoryStorage()));
    const { result } = renderHook(() => useTarefas(), { wrapper: wrapperFor(repo) });
    await act(() =>
      result.current.addTask({
        title: 'Nova',
        subject: '',
        deadline: '',
        priority: 'média',
        done: false,
      }),
    );
    expect(result.current.tasks.map((t) => t.title)).toEqual(['Nova']);
    await act(async () => release('tasks'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks.map((t) => t.title)).toEqual(['Nova']);
  });

  it('eventos', async () => {
    const { repo, release } = withSlowFirstRead(createLocalRepository(createMemoryStorage()));
    const { result } = renderHook(() => useEventos(), { wrapper: wrapperFor(repo) });
    await act(() =>
      result.current.addEvent({
        title: 'Prova',
        date: '2026-10-01',
        category: 'provas',
        notes: '',
      }),
    );
    await act(async () => release('events'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events.map((e) => e.title)).toEqual(['Prova']);
  });
});

describe('gravação bem-sucedida atualiza o estado da lista', () => {
  it('mostra a lista mesmo que a carga inicial ainda não tenha chegado', async () => {
    const { repo } = withSlowFirstRead(createLocalRepository(createMemoryStorage()));
    const { result } = renderHook(() => useTarefas(), { wrapper: wrapperFor(repo) });
    expect(result.current.loading).toBe(true);
    await act(() =>
      result.current.addTask({
        title: 'Nova',
        subject: '',
        deadline: '',
        priority: 'média',
        done: false,
      }),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.tasks).toHaveLength(1);
  });

  it('limpa o erro de carga depois de uma leitura bem-sucedida', async () => {
    const base = createLocalRepository(createMemoryStorage());
    let fail = true;
    const repo: MedFocoRepository = {
      ...base,
      listEvents: () => (fail ? Promise.reject(new Error('falhou')) : base.listEvents()),
    };
    const { result } = renderHook(() => useEventos(), { wrapper: wrapperFor(repo) });
    await waitFor(() => expect(result.current.loadError).toBe(true));
    fail = false;
    await act(() =>
      result.current.addEvent({
        title: 'Prova',
        date: '2026-10-01',
        category: 'provas',
        notes: '',
      }),
    );
    expect(result.current.loadError).toBe(false);
    expect(result.current.events).toHaveLength(1);
  });
});
