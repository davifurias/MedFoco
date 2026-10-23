import { useLayoutEffect, useState } from 'react';
import { useRepository } from '../data/RepositoryContext';
import type { Theme } from '../data/types';
import { applyTheme, currentTheme } from './theme';

/**
 * Tema em vigor e a troca entre escuro e claro. Ao montar, aplica o tema salvo (antes de a primeira
 * imagem ser desenhada); a escolha é só uma preferência, então, se não puder ser salva, vale até
 * fechar a página.
 */
export function useTheme() {
  const repository = useRepository();
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'escuro' ? 'claro' : 'escuro';

  useLayoutEffect(() => {
    let active = true;
    repository
      .getTheme()
      .then((saved) => {
        if (!active) return;
        applyTheme(saved);
        setTheme(saved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [repository]);

  function toggle() {
    applyTheme(next);
    setTheme(next);
    repository.saveTheme(next).catch(() => {});
  }

  return { theme, next, toggle };
}
