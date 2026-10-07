import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import type { MedFocoRepository } from '../../data/repository';
import { routes } from '../../routes/routes';

function renderApp(storage: KeyValueStorage = createMemoryStorage(), repo?: MedFocoRepository) {
  const router = createMemoryRouter(routes, { initialEntries: ['/ideias'] });
  render(<App router={router} repository={repo ?? createLocalRepository(storage)} />);
  return storage;
}

const seed = (storage: KeyValueStorage, items: unknown[]) =>
  storage.setItem(STORAGE_KEYS.appIdeas, JSON.stringify(items));
const stored = (storage: KeyValueStorage, key = STORAGE_KEYS.appIdeas) =>
  JSON.parse(storage.getItem(key) ?? '[]') as Record<string, unknown>[];
const idea = (id: number, extra: Record<string, unknown> = {}) => ({
  id: `i${id}`,
  text: `Ideia ${id}`,
  createdAt: new Date(2026, 9, id).getTime(),
  ...extra,
});
const field = () => screen.getByLabelText('Ideia para o MedFoco');
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Ideias do App', () => {
  it('abre vazia e explica que, por enquanto, o espaço é só deste aparelho', async () => {
    const storage = renderApp();
    expect(await screen.findByText('Nenhuma ideia salva ainda.')).toBeTruthy();
    expect(screen.getByText(/só neste aparelho/)).toBeTruthy();
    expect(storage.getItem(STORAGE_KEYS.appIdeas)).toBeNull();
  });

  it('salva a ideia sem espaços sobrando, com a data de hoje, e limpa a caixa', async () => {
    const storage = renderApp();
    await screen.findByText('Nenhuma ideia salva ainda.');
    fireEvent.change(field(), { target: { value: '  Avisar por e-mail  ' } });
    click('Salvar ideia');
    expect(await screen.findByText('Ideia salva!')).toBeTruthy();
    expect(stored(storage)).toMatchObject([{ text: 'Avisar por e-mail' }]);
    expect(screen.getByText('Avisar por e-mail')).toBeTruthy();
    expect(screen.getByText('07 de out. de 2026')).toBeTruthy();
    expect((field() as HTMLTextAreaElement).value).toBe('');
    expect(document.activeElement).toBe(field());
  });

  it('não salva texto vazio: avisa e leva o foco à caixa', async () => {
    const storage = renderApp();
    await screen.findByText('Nenhuma ideia salva ainda.');
    fireEvent.change(field(), { target: { value: '   ' } });
    click('Salvar ideia');
    expect(screen.getByText('Escreva uma ideia antes de salvar.')).toBeTruthy();
    expect(document.activeElement).toBe(field());
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(storage.getItem(STORAGE_KEYS.appIdeas)).toBeNull();
  });

  it('mostra erro e mantém o texto quando não consegue gravar', async () => {
    const base = createMemoryStorage();
    renderApp({
      getItem: (k) => base.getItem(k),
      setItem: (k, v) => {
        if (k === STORAGE_KEYS.appIdeas) throw new Error('cheio');
        base.setItem(k, v);
      },
    });
    await screen.findByText('Nenhuma ideia salva ainda.');
    fireEvent.change(field(), { target: { value: 'Minha ideia' } });
    click('Salvar ideia');
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
    expect((field() as HTMLTextAreaElement).value).toBe('Minha ideia');
  });

  it('lista da mais recente para a mais antiga e ignora itens danificados sem apagá-los', async () => {
    const storage = createMemoryStorage();
    seed(storage, [idea(1), idea(3), null, 'x', { id: 'z' }, idea(2)]);
    renderApp(storage);
    await screen.findByText('Ideia 3');
    const texts = [...document.querySelectorAll('.ideia-texto')].map((n) => n.textContent);
    expect(texts).toEqual(['Ideia 3', 'Ideia 2', 'Ideia 1']);
    fireEvent.change(field(), { target: { value: 'Nova' } });
    click('Salvar ideia');
    await screen.findByText('Ideia salva!');
    expect(stored(storage)).toHaveLength(7);
  });

  it('não mistura com o Caderno: as listas são separadas', async () => {
    const storage = renderApp();
    await screen.findByText('Nenhuma ideia salva ainda.');
    fireEvent.change(field(), { target: { value: 'Do mural' } });
    click('Salvar ideia');
    await screen.findByText('Ideia salva!');
    expect(storage.getItem(STORAGE_KEYS.notebook)).toBeNull();
  });

  it('só exclui depois de confirmar, mantém as outras e leva o foco ao título da lista', async () => {
    const storage = createMemoryStorage();
    seed(storage, [idea(1), idea(2)]);
    renderApp(storage);
    await screen.findByText('Ideia 1');
    click('Excluir ideia: Ideia 1');
    click('Cancelar');
    expect(screen.getByText('Ideia 1')).toBeTruthy();
    click('Excluir ideia: Ideia 1');
    click('Excluir');
    await waitFor(() => expect(screen.queryByText('Ideia 1')).toBeNull());
    expect(screen.getByText('Ideia 2')).toBeTruthy();
    expect(stored(storage)).toHaveLength(1);
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Ideias salvas'));
  });

  it('mostra erro quando a exclusão falha e mantém a ideia', async () => {
    const base = createMemoryStorage();
    seed(base, [idea(1)]);
    renderApp({
      getItem: (k) => base.getItem(k),
      setItem: () => {
        throw new Error('falha');
      },
    });
    await screen.findByText('Ideia 1');
    click('Excluir ideia: Ideia 1');
    click('Excluir');
    expect(
      await screen.findByText('Não foi possível excluir a ideia. Tente novamente.'),
    ).toBeTruthy();
    expect(screen.getByText('Ideia 1')).toBeTruthy();
  });

  it('mostra erro de carga em vez de uma lista vazia enganosa', async () => {
    const base = createLocalRepository(createMemoryStorage());
    renderApp(undefined, { ...base, listAppIdeas: () => Promise.reject(new Error('x')) });
    expect(
      (await screen.findByText('Não foi possível carregar as ideias.')).getAttribute('role'),
    ).toBe('alert');
  });

  it('não deixa uma carga atrasada apagar a ideia recém-salva', async () => {
    const real = createLocalRepository(createMemoryStorage());
    let release: (list: never[]) => void = () => {};
    renderApp(undefined, {
      ...real,
      listAppIdeas: vi
        .fn()
        .mockImplementationOnce(() => new Promise<never[]>((resolve) => (release = resolve)))
        .mockImplementation(() => real.listAppIdeas()),
    });
    fireEvent.change(field(), { target: { value: 'Rápida' } });
    click('Salvar ideia');
    await screen.findByText('Ideia salva!');
    await act(async () => release([]));
    expect(screen.getByText('Rápida')).toBeTruthy();
  });

  it('textos longos e sem espaços não estouram a tela (quebram linha)', async () => {
    const storage = createMemoryStorage();
    seed(storage, [idea(1, { text: 'x'.repeat(400) })]);
    renderApp(storage);
    const node = await screen.findByText('x'.repeat(400));
    expect(node.className).toContain('ideia-texto');
  });
});
