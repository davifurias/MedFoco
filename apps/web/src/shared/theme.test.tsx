import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from '../components/ThemeToggle';
import { createMemoryStorage, type KeyValueStorage } from '../data/localRepository';
import { THEME_STORAGE_KEY, applyTheme, initTheme, loadTheme, saveTheme } from './theme';

const root = () => document.documentElement.dataset.theme;

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe('tema', () => {
  it('o padrão é o escuro', () => {
    const storage = createMemoryStorage();
    expect(loadTheme(storage)).toBe('escuro');
    expect(initTheme(storage)).toBe('escuro');
    expect(root()).toBe('dark');
  });

  it('lembra a escolha salva', () => {
    const storage = createMemoryStorage();
    saveTheme(storage, 'claro');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('claro');
    expect(initTheme(storage)).toBe('claro');
    expect(root()).toBe('light');
  });

  it('ignora valores salvos desconhecidos ou armazenamento quebrado', () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, 'azul');
    expect(loadTheme(storage)).toBe('escuro');
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(loadTheme(broken)).toBe('escuro');
    expect(() => saveTheme(broken, 'claro')).not.toThrow();
  });

  it('applyTheme troca o atributo do documento', () => {
    applyTheme('claro');
    expect(root()).toBe('light');
    applyTheme('escuro');
    expect(root()).toBe('dark');
  });
});

describe('botão de tema', () => {
  it('alterna entre escuro e claro, aplica na hora e guarda a escolha', () => {
    const storage = createMemoryStorage();
    initTheme(storage);
    render(<ThemeToggle storage={storage} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(root()).toBe('light');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('claro');
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }));
    expect(root()).toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('escuro');
  });

  it('começa oferecendo o claro quando o tema salvo é o escuro, e o inverso', () => {
    const storage = createMemoryStorage();
    saveTheme(storage, 'claro');
    render(<ThemeToggle storage={storage} />);
    expect(screen.getByRole('button', { name: 'Mudar para o tema escuro' })).toBeTruthy();
  });

  it('continua funcionando quando não consegue guardar a escolha', () => {
    const storage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('cheio');
      },
    };
    render(<ThemeToggle storage={storage} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(root()).toBe('light');
    expect(screen.getByRole('button', { name: 'Mudar para o tema escuro' })).toBeTruthy();
  });
});
