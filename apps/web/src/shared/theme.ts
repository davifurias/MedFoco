import type { Theme } from '../data/types';

/** Escuro é o tema padrão do app (o mesmo valor que o repositório devolve sem escolha salva). */
export const DEFAULT_THEME: Theme = 'escuro';

const DATA_THEME: Record<Theme, string> = { escuro: 'dark', claro: 'light' };

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = DATA_THEME[theme];
}

/** Tema que está valendo na página agora. */
export function currentTheme(root: HTMLElement = document.documentElement): Theme {
  return root.dataset.theme === 'light' ? 'claro' : DEFAULT_THEME;
}
