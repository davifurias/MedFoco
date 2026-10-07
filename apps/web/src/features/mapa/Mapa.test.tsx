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
import type { Material } from '../../data/types';
import { routes } from '../../routes/routes';

function renderApp(storage: KeyValueStorage) {
  const router = createMemoryRouter(routes, { initialEntries: ['/mapa'] });
  render(<App router={router} repository={createLocalRepository(storage)} />);
}

const storageWith = (materials: unknown): KeyValueStorage => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEYS.materials, JSON.stringify(materials));
  return storage;
};

const mat = (id: string, extra: Partial<Material> = {}): Material => ({
  id,
  subject: 'Cardiologia',
  title: `Material ${id}`,
  notes: '',
  tags: [],
  type: 'nota',
  videoLink: '',
  createdAt: 1,
  ...extra,
});

const map = () => screen.findByRole('region', { name: 'Mapa visual de conexões' });

afterEach(cleanup);

describe('Mapa', () => {
  it('sem materiais, orienta a adicionar na aba Matérias', async () => {
    renderApp(createMemoryStorage());
    expect((await map()).textContent).toContain('Adicione materiais com assuntos-chave');
    expect(screen.queryByRole('button', { name: /Cardiologia/ })).toBeNull();
  });

  it('mostra um ponto por material, a legenda por matéria e a lista de conexões', async () => {
    renderApp(
      storageWith([
        mat('1', { tags: ['Coração'] }),
        mat('2', { subject: 'Pneumo', tags: ['coracao', 'pulmão'] }),
        mat('3', { subject: 'Pneumo', tags: ['rim'] }),
      ]),
    );
    const region = await map();
    expect(within(region).getAllByRole('button')).toHaveLength(3);
    const legend = within(region).getByRole('list', { name: 'Matérias' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Cardiologia', 'Pneumo']);
    const links = within(region)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(links).toContain('Material 1 ↔ Material 2: Coração');
    expect(links.filter((t) => t?.includes('↔'))).toHaveLength(1);
  });

  it('avisa quando nenhum material se conecta', async () => {
    renderApp(storageWith([mat('1', { tags: ['a'] }), mat('2', { tags: ['b'] })]));
    expect((await map()).textContent).toContain('Nenhuma conexão ainda');
  });

  it('mostra os detalhes ao clicar e também pelo teclado', async () => {
    renderApp(
      storageWith([
        mat('1', { tags: ['x', 'y'], notes: 'n'.repeat(250) }),
        mat('2', { title: 'Outro', tags: [] }),
      ]),
    );
    const region = await map();
    const first = within(region).getByRole('button', { name: 'Material 1, Cardiologia' });
    fireEvent.click(first);
    expect(first.getAttribute('aria-pressed')).toBe('true');
    expect(region.textContent).toContain('Assuntos: x, y');
    expect(region.textContent).toContain(`${'n'.repeat(200)}…`);
    expect(region.textContent).not.toContain('n'.repeat(201));

    const other = within(region).getByRole('button', { name: 'Outro, Cardiologia' });
    fireEvent.keyDown(other, { key: 'Enter' });
    expect(other.getAttribute('aria-pressed')).toBe('true');
    expect(first.getAttribute('aria-pressed')).toBe('false');
    fireEvent.keyDown(first, { key: ' ' });
    expect(first.getAttribute('aria-pressed')).toBe('true');
  });

  it('corta no desenho títulos longos, mas deixa o completo no nome acessível', async () => {
    const title = 'Título muito comprido de material';
    renderApp(storageWith([mat('1', { title })]));
    const region = await map();
    expect(within(region).getByRole('button', { name: `${title}, Cardiologia` })).toBeTruthy();
    expect(region.textContent).toContain('Título muito …');
  });

  it('ignora itens danificados em vez de quebrar a tela', async () => {
    renderApp(storageWith([mat('1', { tags: ['a'] }), null, 'lixo', { id: 5 }]));
    await waitFor(async () =>
      expect((await map()).querySelectorAll('[role="button"]').length).toBeGreaterThan(0),
    );
  });
});
