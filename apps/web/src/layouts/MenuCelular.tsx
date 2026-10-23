import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { MENU_GROUPS } from '../app/navigation';
import { Icon } from '../components/Icon';
import { useTheme } from '../shared/useTheme';

/** Distância mínima (px) do gesto de deslizar para a direita que fecha o menu. */
const SWIPE_CLOSE_PX = 60;

/**
 * Menu ⋯ do celular: painel que desliza da direita, com a tela escurecida atrás. Fecha pelo X,
 * tocando fora, com Esc ou deslizando para a direita. O foco fica preso dentro dele enquanto está
 * aberto e volta ao botão ⋯ ao fechar.
 */
export function MenuCelular({
  onClose,
  onNavigate,
  pathname,
}: {
  onClose: () => void;
  /** Ao escolher uma área: fecha sem devolver o foco ao botão, porque a tela vai mudar. */
  onNavigate: () => void;
  pathname: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef(0);
  const { theme, toggle } = useTheme();
  const dark = theme === 'escuro';

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('button, a')?.focus();
  }, []);

  function trapFocus(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = panelRef.current?.querySelectorAll<HTMLElement>('button, a');
    if (!items?.length) return;
    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="menu-celular">
      <div className="menu-fundo" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="menu-painel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onKeyDown={trapFocus}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? 0;
        }}
        onTouchEnd={(e) => {
          if ((e.changedTouches[0]?.clientX ?? 0) - touchStart.current > SWIPE_CLOSE_PX) onClose();
        }}
      >
        <div className="menu-topo">
          <span className="menu-avatar">
            <Icon name="marca" />
          </span>
          <span className="menu-nome">MedFoco</span>
          <button type="button" className="menu-fechar" onClick={onClose} aria-label="Fechar menu">
            <Icon name="remover" />
          </button>
        </div>
        <div className="menu-grupo">
          <div className="menu-linha">
            <span className="menu-icone">
              <Icon name={dark ? 'tema-escuro' : 'tema-claro'} />
            </span>
            <span className="menu-rotulo" id="menu-tema-rotulo">
              Tema escuro
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              aria-labelledby="menu-tema-rotulo"
              className="menu-switch"
              onClick={toggle}
            >
              <span className="menu-knob" />
            </button>
          </div>
        </div>
        {MENU_GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <div className="menu-titulo" aria-hidden="true">
              {group.title}
            </div>
            <ul className="menu-grupo">
              {group.areas.map((area) => (
                <li key={area.path}>
                  <Link
                    to={area.path}
                    className="menu-linha menu-link"
                    aria-current={pathname === area.path ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <span className="menu-icone">
                      <Icon name={area.icon} />
                    </span>
                    <span className="menu-rotulo">{area.label}</span>
                    <Icon name="seta" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
