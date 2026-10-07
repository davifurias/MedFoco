import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../app/App';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import type { MedFocoRepository } from '../../data/repository';
import { routes } from '../../routes/routes';

function renderApp(
  path = '/busca',
  storage: KeyValueStorage = createMemoryStorage(),
  repo?: MedFocoRepository,
) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App router={router} repository={repo ?? createLocalRepository(storage)} />);
  return router;
}

const seed = (storage: KeyValueStorage, key: string, items: unknown[]) =>
  storage.setItem(key, JSON.stringify(items));

function fullStorage(): KeyValueStorage {
  const storage = createMemoryStorage();
  seed(storage, STORAGE_KEYS.events, [
    {
      id: 'e1',
      title: 'Prova de Cardiologia',
      date: '2026-12-01',
      category: 'provas',
      notes: '',
      createdAt: 1,
    },
  ]);
  seed(storage, STORAGE_KEYS.materials, [
    {
      id: 'm1',
      subject: 'Cardiologia',
      title: 'Aula do coração',
      notes: '',
      tags: ['Valvas'],
      type: 'nota',
      videoLink: '',
      createdAt: 1,
    },
  ]);
  seed(storage, STORAGE_KEYS.tasks, [
    {
      id: 't1',
      title: 'Resumo de cardio',
      subject: 'Cardiologia',
      deadline: '',
      priority: 'média',
      done: false,
      createdAt: 1,
    },
  ]);
  seed(storage, STORAGE_KEYS.questions, [
    {
      id: 'q1',
      subject: 'Cardiologia',
      topic: 'IC',
      difficulty: 'fácil',
      question: 'Qual o exame do coração?',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
      explanation: '',
      createdAt: 1,
    },
  ]);
  seed(storage, STORAGE_KEYS.appIdeas, [
    { id: 'a1', text: 'Mais questões de coração', createdAt: 1 },
  ]);
  seed(storage, STORAGE_KEYS.notebook, [
    { id: 'n1', text: 'Estudar o coração no domingo', createdAt: 1 },
  ]);
  return storage;
}

const box = () => screen.getByLabelText('Texto da busca') as HTMLInputElement;
const type = (value: string) => fireEvent.change(box(), { target: { value } });
const section = (name: string) => screen.getByRole('region', { name: new RegExp(`^${name} \\(`) });
const status = () =>
  screen
    .getAllByRole('status')
    .map((n) => n.textContent)
    .join('');

afterEach(cleanup);

describe('Busca', () => {
  it('abre com o cursor na caixa e pede o mínimo de letras', async () => {
    renderApp();
    expect(document.activeElement).toBe(box());
    expect(status()).toBe('Digite pelo menos 2 letras para buscar.');
    type('c');
    expect(status()).toBe('Digite pelo menos 2 letras para buscar.');
    type('  ');
    expect(status()).toBe('Digite pelo menos 2 letras para buscar.');
  });

  it('acha em todas as áreas, na ordem do app original, ignorando acento e maiúsculas', async () => {
    renderApp('/busca', fullStorage());
    await waitFor(() => expect(box()).toBeTruthy());
    type('CORACAO');
    await waitFor(() => expect(status()).toBe('4 resultados.'));
    const names = screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'));
    expect(names).toEqual([
      'busca-title',
      'busca-materias',
      'busca-questoes',
      'busca-ideiasApp',
      'busca-caderno',
    ]);
    expect(within(section('Matérias')).getByText('Aula do coração')).toBeTruthy();
    expect(within(section('Questões')).getByText('Qual o exame do coração?')).toBeTruthy();
    expect(within(section('Ideias do app')).getByText('Mais questões de coração')).toBeTruthy();
    expect(
      within(section('Caderno de ideias')).getByText('Estudar o coração no domingo'),
    ).toBeTruthy();
  });

  it('mostra o detalhe de cada item e a contagem por área', async () => {
    renderApp('/busca', fullStorage());
    type('cardiologia');
    await waitFor(() => expect(status()).toBe('4 resultados.'));
    expect(within(section('Eventos')).getByText('01 de dez. de 2026')).toBeTruthy();
    expect(within(section('Matérias')).getByText('Cardiologia')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Tarefas \(1\)/ })).toBeTruthy();
  });

  it('avisa quando não há resultado', async () => {
    renderApp('/busca', fullStorage());
    type('zzzz');
    await waitFor(() => expect(status()).toBe('Nada encontrado.'));
  });

  it('1 resultado fica no singular', async () => {
    renderApp('/busca', fullStorage());
    type('valvas');
    await waitFor(() => expect(status()).toBe('1 resultado.'));
  });

  it('mostra até 8 por área e avisa quando há mais', async () => {
    const storage = createMemoryStorage();
    seed(
      storage,
      STORAGE_KEYS.notebook,
      Array.from({ length: 10 }, (_, i) => ({ id: `n${i}`, text: `nota ${i}`, createdAt: i })),
    );
    seed(
      storage,
      STORAGE_KEYS.appIdeas,
      Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, text: `nota ${i}`, createdAt: i })),
    );
    renderApp('/busca', storage);
    type('nota');
    await waitFor(() => expect(status()).toBe('18 resultados.'));
    const caderno = section('Caderno de ideias');
    expect(within(caderno).getAllByRole('listitem')).toHaveLength(8);
    expect(within(caderno).getByText('Mostrando 8 de 10.')).toBeTruthy();
    expect(within(section('Ideias do app')).queryByText(/Mostrando/)).toBeNull();
  });

  it('os atalhos levam à aba certa, inclusive Tarefas e Caderno', async () => {
    const targets: [string, string][] = [
      ['Eventos', '/agenda'],
      ['Matérias', '/materias'],
      ['Tarefas', '/agenda/tarefas'],
      ['Questões', '/questoes'],
      ['Ideias do app', '/ideias'],
      ['Caderno de ideias', '/ideias/caderno'],
    ];
    for (const [name, path] of targets) {
      const router = renderApp('/busca', fullStorage());
      type('cardio coracao'.split(' ')[name === 'Tarefas' || name === 'Eventos' ? 0 : 1] as string);
      await waitFor(() => expect(within(section(name)).getByRole('link')).toBeTruthy());
      const link = within(section(name)).getByRole('link', { name: `Ver na aba → ${name}` });
      expect(link.textContent).toContain(name);
      fireEvent.click(link);
      expect(router.state.location.pathname).toBe(path);
      cleanup();
    }
  });

  it('guarda o texto no endereço e o recupera ao abrir ou recarregar', async () => {
    const router = renderApp('/busca', fullStorage());
    type('valvas');
    expect(router.state.location.search).toBe('?q=valvas');
    // Digitar não enche o histórico: cada tecla substitui a entrada anterior.
    expect(router.state.historyAction).toBe('REPLACE');
    cleanup();
    renderApp('/busca?q=valvas', fullStorage());
    expect(box().value).toBe('valvas');
    await waitFor(() => expect(status()).toBe('1 resultado.'));
    type('');
    expect(status()).toBe('Digite pelo menos 2 letras para buscar.');
  });

  it('apagar o texto remove o ?q= do endereço', () => {
    const router = renderApp('/busca?q=ab', fullStorage());
    type('');
    expect(router.state.location.search).toBe('');
  });

  it('se uma área não carregar, as outras continuam e avisa qual falhou', async () => {
    const real = createLocalRepository(fullStorage());
    renderApp('/busca', undefined, {
      ...real,
      listQuestions: () => Promise.reject(new Error('x')),
    });
    type('coracao');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Não foi possível carregar: Questões.',
    );
    await waitFor(() =>
      expect(within(section('Matérias')).getByText('Aula do coração')).toBeTruthy(),
    );
    expect(screen.queryByRole('region', { name: /^Questões \(/ })).toBeNull();
  });

  it('ignora itens danificados e corta textos longos', async () => {
    const storage = createMemoryStorage();
    seed(storage, STORAGE_KEYS.notebook, [
      null,
      { id: 'x' },
      { id: 'n', text: `abc ${'z'.repeat(120)}`, createdAt: 1 },
    ]);
    renderApp('/busca', storage);
    type('abc');
    await waitFor(() => expect(status()).toBe('1 resultado.'));
    expect(within(section('Caderno de ideias')).getByText(`abc ${'z'.repeat(76)}…`)).toBeTruthy();
  });
});
