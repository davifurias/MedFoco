import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { documentTitleFor, pageNameFor } from '../app/navigation';

/**
 * Ao trocar de tela: atualiza o título da aba e avisa leitores de tela (sem mexer no foco do
 * teclado). Na primeira abertura só o título muda, para não anunciar a tela inicial por cima do
 * restante da página.
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState('');
  const first = useRef(true);

  useEffect(() => {
    document.title = documentTitleFor(pathname);
    if (first.current) {
      first.current = false;
      return;
    }
    setAnnouncement(pageNameFor(pathname) ?? '');
  }, [pathname]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
