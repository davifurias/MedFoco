import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  path = '/perfil',
  storage: KeyValueStorage = createMemoryStorage(),
  repo?: MedFocoRepository,
) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App router={router} repository={repo ?? createLocalRepository(storage)} />);
  return { router, storage };
}

const field = (name: string) => screen.findByLabelText(name) as Promise<HTMLInputElement>;
const change = async (name: string, value: string) =>
  fireEvent.change(await field(name), { target: { value } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));
const stored = (storage: KeyValueStorage) =>
  JSON.parse(storage.getItem(STORAGE_KEYS.profile) ?? 'null') as Record<string, string> | null;

afterEach(cleanup);

describe('Perfil acadêmico', () => {
  it('abre com o curso "Medicina" e os demais campos vazios, sem gravar nada', async () => {
    const { storage } = renderApp();
    expect((await field('Curso')).value).toBe('Medicina');
    for (const name of [
      'Período',
      'Matérias que está cursando',
      'Suas metas',
      'Preferências de estudo',
    ]) {
      expect((await field(name)).value).toBe('');
    }
    expect(storage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it('explica que os dados ficam só neste aparelho, sem prometer IA que ainda não existe', async () => {
    renderApp();
    await field('Curso');
    const note = screen.getByText(/ficam só neste aparelho/);
    expect(note.textContent).toContain('Quando a IA da Assessora estiver disponível');
    expect(document.body.textContent).not.toMatch(/tdah|certeiras/i);
  });

  it('salva sem espaços nas pontas e mantém depois de recarregar', async () => {
    const { storage } = renderApp();
    await change('Curso', '  Medicina  ');
    await change('Período', ' 4º período ');
    await change('Matérias que está cursando', ' Neuro, Cardio ');
    await change('Suas metas', ' Passar em Neuro ');
    await change('Preferências de estudo', ' Rendo mais de manhã ');
    save();
    expect(await screen.findByText('Salvo!')).toBeTruthy();
    expect(stored(storage)).toEqual({
      curso: 'Medicina',
      periodo: '4º período',
      materias: 'Neuro, Cardio',
      metas: 'Passar em Neuro',
      preferencias: 'Rendo mais de manhã',
    });
    expect((await field('Período')).value).toBe('4º período');
    cleanup();
    renderApp('/perfil', storage);
    expect((await field('Período')).value).toBe('4º período');
    expect((await field('Suas metas')).value).toBe('Passar em Neuro');
  });

  it('apagar o curso e salvar o deixa em branco (não volta a "Medicina")', async () => {
    const { storage } = renderApp();
    await change('Curso', '   ');
    save();
    await screen.findByText('Salvo!');
    expect(stored(storage)?.curso).toBe('');
    cleanup();
    renderApp('/perfil', storage);
    expect((await field('Curso')).value).toBe('');
  });

  it('a mensagem "Salvo!" some quando o usuário volta a editar', async () => {
    renderApp();
    await change('Período', '3º');
    save();
    await screen.findByText('Salvo!');
    await change('Período', '4º');
    expect(screen.queryByText('Salvo!')).toBeNull();
  });

  it('avisa e mantém o que foi digitado quando não consegue gravar', async () => {
    const base = createMemoryStorage();
    renderApp(
      '/perfil',
      undefined,
      createLocalRepository({
        getItem: (k) => base.getItem(k),
        setItem: () => {
          throw new Error('cheio');
        },
      }),
    );
    await change('Período', '4º período');
    save();
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
    expect((await field('Período')).value).toBe('4º período');
  });

  it('com dados salvos ilegíveis, abre com o padrão e guarda cópia antes de gravar por cima', async () => {
    const base = createMemoryStorage();
    base.setItem(STORAGE_KEYS.profile, '{quebrado');
    const written = new Map<string, string>();
    const storage: KeyValueStorage = {
      getItem: (k) => base.getItem(k),
      setItem: (k, v) => {
        written.set(k, v);
        base.setItem(k, v);
      },
    };
    renderApp('/perfil', storage);
    expect((await field('Curso')).value).toBe('Medicina');
    await change('Período', '5º');
    save();
    await screen.findByText('Salvo!');
    expect([...written.keys()].filter((k) => k.includes(':backup:'))).toHaveLength(1);
    expect([...written.values()]).toContain('{quebrado');
    expect(stored(storage)?.periodo).toBe('5º');
  });

  it('campos salvos com tipo errado voltam ao padrão sem quebrar a tela', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({ curso: 7, periodo: ['x'], metas: 'Boa meta' }),
    );
    renderApp('/perfil', storage);
    expect((await field('Curso')).value).toBe('Medicina');
    expect((await field('Período')).value).toBe('');
    expect((await field('Suas metas')).value).toBe('Boa meta');
  });

  it('mostra erro de carga em vez de um formulário vazio enganoso', async () => {
    const real = createLocalRepository(createMemoryStorage());
    renderApp('/perfil', undefined, { ...real, getProfile: () => Promise.reject(new Error('x')) });
    expect(
      (await screen.findByText('Não foi possível carregar seu perfil.')).getAttribute('role'),
    ).toBe('alert');
    expect(screen.queryByRole('button', { name: 'Salvar perfil' })).toBeNull();
  });

  it('o botão do Início leva ao Perfil e o link volta ao Início', async () => {
    const { router } = renderApp('/');
    fireEvent.click(await screen.findByRole('link', { name: /Editar perfil acadêmico/ }));
    expect(router.state.location.pathname).toBe('/perfil');
    await field('Curso');
    fireEvent.click(screen.getByRole('link', { name: /Voltar ao início/ }));
    expect(router.state.location.pathname).toBe('/');
  });
});
