import type { KeyValueStorage } from '../data/localRepository';

export type Theme = 'escuro' | 'claro';

/** Escuro é o tema padrão do app. */
export const DEFAULT_THEME: Theme = 'escuro';
export const THEME_STORAGE_KEY = 'medfoco:v1:theme';

const DATA_THEME: Record<Theme, string> = { escuro: 'dark', claro: 'light' };

/** Tema salvo; qualquer valor ausente, ilegível ou desconhecido vira o padrão. */
export function loadTheme(storage: KeyValueStorage): Theme {
  try {
    const saved = storage.getItem(THEME_STORAGE_KEY);
    return saved === 'claro' || saved === 'escuro' ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** A escolha é só uma preferência: se não puder ser salva, o tema vale até fechar a página. */
export function saveTheme(storage: KeyValueStorage, theme: Theme): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // sem armazenamento: nada a fazer
  }
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = DATA_THEME[theme];
}

/** Aplica o tema salvo; chamado antes de desenhar o app. */
export function initTheme(storage: KeyValueStorage): Theme {
  const theme = loadTheme(storage);
  applyTheme(theme);
  return theme;
}
