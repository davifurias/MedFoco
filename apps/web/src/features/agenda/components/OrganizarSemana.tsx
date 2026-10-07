import { useState } from 'react';
import { AiUnavailableError } from '../../../shared/ai';
import type { OrganizeWeek } from '../services/organizarSemana';

type Status = 'idle' | 'loading' | 'unavailable' | 'error';

const MESSAGES: Record<Exclude<Status, 'idle'>, string> = {
  loading: 'Organizando...',
  unavailable:
    'A organização da semana com IA ainda não está disponível nesta versão do MedFoco. Ela chegará em uma próxima atualização.',
  error: 'Não consegui organizar a semana agora. Tente novamente mais tarde.',
};

/** Botão "Organizar minha semana com IA" (sem IA nesta versão; não simula resultado). */
export function OrganizarSemana({ organize }: { organize: OrganizeWeek }) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleClick() {
    setStatus('loading');
    try {
      await organize();
      // A partir da Fase 3: exibir a organização sugerida.
      setStatus('idle');
    } catch (error) {
      setStatus(error instanceof AiUnavailableError ? 'unavailable' : 'error');
    }
  }

  return (
    <div className="organizar-semana">
      <button
        type="button"
        className="btn secondary"
        onClick={handleClick}
        disabled={status === 'loading'}
      >
        Organizar minha semana com IA 🧭
      </button>
      <div className="note" aria-live="polite">
        {status === 'idle' ? '' : MESSAGES[status]}
      </div>
    </div>
  );
}
