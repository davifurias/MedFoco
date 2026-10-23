import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../data/localRepository';
import { RepositoryProvider } from '../data/RepositoryContext';
import { applyTheme, currentTheme } from './theme';

const root = () => document.documentElement.dataset.theme;

function renderToggle(storage: KeyValueStorage = createMemoryStorage()) {
  render(
    <RepositoryProvider repository={createLocalRepository(storage)}>
      <ThemeToggle />
    </RepositoryProvider>,
  );
  return storage;
}

const flush = () => act(async () => {});

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe('tema na página', () => {
  it('applyTheme troca o atributo do documento e currentTheme o lê de volta', () => {
    expect(currentTheme()).toBe('claro');
    applyTheme('escuro');
    expect(root()).toBe('dark');
    expect(currentTheme()).toBe('escuro');
    applyTheme('claro');
    expect(root()).toBe('light');
    expect(currentTheme()).toBe('claro');
  });
});

describe('botão de tema', () => {
  it('sem escolha salva, fica no claro e oferece o escuro', async () => {
    renderToggle();
    await flush();
    expect(root()).toBe('light');
    expect(screen.getByRole('button', { name: 'Mudar para o tema escuro' })).toBeTruthy();
  });

  it('aplica o tema salvo ao abrir', async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEYS.theme, 'escuro');
    renderToggle(storage);
    await flush();
    expect(root()).toBe('dark');
    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeTruthy();
  });

  it('alterna entre claro e escuro, aplica na hora e guarda a escolha', async () => {
    const storage = renderToggle();
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }));
    expect(root()).toBe('dark');
    await flush();
    expect(storage.getItem(STORAGE_KEYS.theme)).toBe('escuro');
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(root()).toBe('light');
    await flush();
    expect(storage.getItem(STORAGE_KEYS.theme)).toBe('claro');
  });

  it('ignora um valor salvo desconhecido', async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEYS.theme, 'azul');
    renderToggle(storage);
    await flush();
    expect(root()).toBe('light');
  });

  it('continua funcionando quando o armazenamento bloqueia a leitura e a gravação', async () => {
    renderToggle({
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
    });
    await flush();
    expect(root()).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }));
    await flush();
    expect(root()).toBe('dark');
    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeTruthy();
  });
});
