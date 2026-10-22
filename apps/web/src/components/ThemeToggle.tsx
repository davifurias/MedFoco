import { useTheme } from '../shared/useTheme';
import { Icon } from './Icon';

/** Botão do cabeçalho que alterna entre o tema claro (padrão) e o escuro. */
export function ThemeToggle() {
  const { theme, next, toggle } = useTheme();
  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={`Mudar para o tema ${next}`}
      title={`Mudar para o tema ${next}`}
    >
      <Icon name={theme === 'escuro' ? 'tema-claro' : 'tema-escuro'} />
      <span className="rotulo">Tema {next}</span>
    </button>
  );
}
