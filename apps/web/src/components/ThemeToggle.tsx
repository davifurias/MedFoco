import { useLayoutEffect, useState } from 'react';
import { useRepository } from '../data/RepositoryContext';
import type { Theme } from '../data/types';
import { applyTheme, currentTheme } from '../shared/theme';

/**
 * Botão do cabeçalho que alterna entre o tema escuro (padrão) e o claro. Ao abrir, aplica o tema
 * salvo (antes de a primeira imagem ser desenhada); a escolha é só uma preferência, então, se não
 * puder ser salva, vale até fechar a página.
 */
export function ThemeToggle() {
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

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={`Mudar para o tema ${next}`}
      title={`Mudar para o tema ${next}`}
    >
      <span aria-hidden="true">{theme === 'escuro' ? '☀️' : '🌙'}</span>
    </button>
  );
}
