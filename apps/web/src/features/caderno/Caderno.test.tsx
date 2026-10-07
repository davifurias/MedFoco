import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { RepositoryProvider } from '../../data/RepositoryContext';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import { routes } from '../../routes/routes';
import { CadernoPage } from './CadernoPage';
import type { ThemeGroup } from './services/organizarCaderno';

const entry = (id: number, extra: Record<string, unknown> = {}) => ({
  id: `n${id}`,
  text: `Solta ${id}`,
  createdAt: id,
  ...extra,
});
const storageWith = (items: unknown[] = []) => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEYS.notebook, JSON.stringify(items));
  return storage;
};
const stored = (storage: KeyValueStorage) =>
  JSON.parse(storage.getItem(STORAGE_KEYS.notebook) ?? '[]') as Record<string, unknown>[];

function renderPage(
  storage: KeyValueStorage,
  organize?: Parameters<typeof CadernoPage>[0]['organize'],
) {
  render(
    <MemoryRouter>
      <RepositoryProvider repository={createLocalRepository(storage)}>
        <CadernoPage organize={organize} />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

const field = () => screen.getByLabelText('Ideia solta');
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

afterEach(cleanup);

describe('Caderno de ideias', () => {
  it('abre pelo app na sub-aba, vazio, sem o botão de organizar', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/ideias/caderno'] });
    render(<App router={router} repository={createLocalRepository(createMemoryStorage())} />);
    expect(await screen.findByText('Nada por aqui ainda.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Ideias soltas (0)' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Organizar com IA/ })).toBeNull();
  });

  it('adiciona ideias soltas, conta e lista da mais recente para a mais antiga', async () => {
    const storage = storageWith([entry(1), entry(2)]);
    renderPage(storage);
    await screen.findByText('Solta 2');
    fireEvent.change(field(), { target: { value: ' Nova ideia ' } });
    click('Adicionar');
    expect(await screen.findByText('Ideia salva!')).toBeTruthy();
    expect(stored(storage)).toHaveLength(3);
    expect(stored(storage)[2]).toMatchObject({ text: 'Nova ideia' });
    expect(screen.getByRole('heading', { name: 'Ideias soltas (3)' })).toBeTruthy();
    const texts = [...document.querySelectorAll('.ideia-texto')].map((n) => n.textContent);
    expect(texts).toEqual(['Nova ideia', 'Solta 2', 'Solta 1']);
  });

  it('mostra as ideias guardadas pela ação rápida do Início', async () => {
    const storage = createMemoryStorage();
    await createLocalRepository(storage).addNotebookEntry({ text: 'Veio do Início' });
    renderPage(storage);
    expect(await screen.findByText('Veio do Início')).toBeTruthy();
  });

  it('texto vazio: avisa e leva o foco à caixa, sem salvar', async () => {
    const storage = storageWith();
    renderPage(storage);
    click('Adicionar');
    expect(screen.getByText('Escreva uma ideia antes de salvar.')).toBeTruthy();
    expect(document.activeElement).toBe(field());
    expect(stored(storage)).toEqual([]);
  });

  it('só exclui depois de confirmar', async () => {
    const storage = storageWith([entry(1), entry(2)]);
    renderPage(storage);
    await screen.findByText('Solta 1');
    click('Excluir ideia: Solta 1');
    click('Cancelar');
    expect(screen.getByText('Solta 1')).toBeTruthy();
    click('Excluir ideia: Solta 1');
    click('Excluir');
    await waitFor(() => expect(screen.queryByText('Solta 1')).toBeNull());
    expect(stored(storage).map((e) => e.id)).toEqual(['n2']);
    expect(screen.getByRole('heading', { name: 'Ideias soltas (1)' })).toBeTruthy();
  });

  it('ignora itens danificados sem apagá-los', async () => {
    const storage = storageWith([entry(1), null, { id: 'x' }, 'lixo']);
    renderPage(storage);
    await screen.findByText('Solta 1');
    expect(screen.getByRole('heading', { name: 'Ideias soltas (1)' })).toBeTruthy();
    click('Excluir ideia: Solta 1');
    click('Excluir');
    await waitFor(() => expect(screen.queryByText('Solta 1')).toBeNull());
    expect(stored(storage)).toHaveLength(3);
  });
});

describe('Caderno — Organizar com IA', () => {
  it('sem IA nesta versão, avisa e não mostra grupos', async () => {
    renderPage(storageWith([entry(1)]));
    await screen.findByText('Solta 1');
    click(/Organizar com IA/);
    expect(
      await screen.findByText(
        'Organizar com IA ainda não está disponível nesta versão do MedFoco.',
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Organizado por tema' })).toBeNull();
  });

  it('mostra as ideias organizadas por tema quando o serviço consegue', async () => {
    const groups: ThemeGroup[] = [
      { theme: 'Estudo', items: ['Solta 2', 'Solta 1'] },
      { theme: 'App', items: ['Algo'] },
    ];
    const organize = vi.fn(async () => groups);
    renderPage(storageWith([entry(1), entry(2)]), organize);
    await screen.findByText('Solta 2');
    click(/Organizar com IA/);
    const section = await screen.findByRole('region', { name: 'Organizado por tema' });
    expect(organize).toHaveBeenCalledWith(['Solta 2', 'Solta 1']);
    const estudo = within(section).getByRole('group', { name: 'Estudo' });
    expect(
      within(estudo)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Solta 2', 'Solta 1']);
    expect(within(section).getByRole('group', { name: 'App' })).toBeTruthy();
  });

  it('trata falha comum, resposta vazia e dados malformados sem quebrar', async () => {
    renderPage(storageWith([entry(1)]), async () => Promise.reject(new Error('x')));
    await screen.findByText('Solta 1');
    click(/Organizar com IA/);
    expect(await screen.findByText('Não consegui organizar agora. Tente novamente.')).toBeTruthy();
    cleanup();

    renderPage(
      storageWith([entry(1)]),
      async () => [{ theme: 3, items: 'x' }, null] as unknown as ThemeGroup[],
    );
    await screen.findByText('Solta 1');
    click(/Organizar com IA/);
    expect(await screen.findByText('Não consegui organizar agora. Tente novamente.')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Organizado por tema' })).toBeNull();
  });

  it('desativa o botão enquanto organiza', async () => {
    let finish: (groups: ThemeGroup[]) => void = () => {};
    renderPage(
      storageWith([entry(1)]),
      () => new Promise<ThemeGroup[]>((resolve) => (finish = resolve)),
    );
    await screen.findByText('Solta 1');
    click(/Organizar com IA/);
    expect(screen.getByText('Organizando...')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /Organizar com IA/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await act(async () => finish([{ theme: 'T', items: ['i'] }]));
    expect(screen.getByRole('region', { name: 'Organizado por tema' })).toBeTruthy();
  });
});
