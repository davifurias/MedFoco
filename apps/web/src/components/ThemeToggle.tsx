import { useState } from 'react';
import { getBrowserStorage, type KeyValueStorage } from '../data/localRepository';
import { applyTheme, loadTheme, saveTheme, type Theme } from '../shared/theme';

/** Botão do cabeçalho que alterna entre o tema escuro (padrão) e o claro. */
export function ThemeToggle({ storage }: { storage?: KeyValueStorage }) {
  const [store] = useState(() => storage ?? getBrowserStorage());
  const [theme, setTheme] = useState<Theme>(() => loadTheme(store));
  const next: Theme = theme === 'escuro' ? 'claro' : 'escuro';

  function toggle() {
    applyTheme(next);
    saveTheme(store, next);
    setTheme(next);
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
