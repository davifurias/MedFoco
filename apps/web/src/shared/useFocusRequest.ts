import { useCallback, useEffect, useState } from 'react';

/**
 * Pede para focar um elemento (pelo id) depois da próxima atualização da tela. Útil quando o
 * elemento que tinha o foco some ou muda de lugar (ex.: item excluído, tarefa que muda de lista).
 */
export function useFocusRequest(): (elementId: string) => void {
  const [target, setTarget] = useState<{ id: string; seq: number } | null>(null);

  useEffect(() => {
    if (target) document.getElementById(target.id)?.focus();
  }, [target]);

  return useCallback((id: string) => {
    setTarget((current) => ({ id, seq: (current?.seq ?? 0) + 1 }));
  }, []);
}
