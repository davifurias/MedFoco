import { useState } from 'react';
import { AiUnavailableError } from '../../../shared/ai';
import type { SummarizeMaterial } from '../services/resumirMaterial';

type Status = 'idle' | 'loading' | 'unavailable' | 'error';

const MESSAGES: Record<Exclude<Status, 'idle'>, string> = {
  loading: 'Gerando...',
  unavailable:
    'O resumo com IA ainda não está disponível nesta versão do MedFoco. Ele chegará em uma próxima atualização.',
  error: 'Não consegui gerar o resumo agora. Tente novamente mais tarde.',
};

/** Botão "Gerar resumo e questões com IA" (sem IA nesta versão; não simula resultado). */
export function ResumirVideo({
  materialId,
  summarize,
}: {
  materialId: string;
  summarize: SummarizeMaterial;
}) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleClick() {
    setStatus('loading');
    try {
      await summarize(materialId);
      // A partir da Fase 3: salvar e exibir o resumo e as questões geradas.
      setStatus('idle');
    } catch (error) {
      setStatus(error instanceof AiUnavailableError ? 'unavailable' : 'error');
    }
  }

  return (
    <div className="resumir-video">
      <button
        type="button"
        className="btn secondary"
        onClick={handleClick}
        disabled={status === 'loading'}
      >
        Gerar resumo e questões com IA ✨
      </button>
      <div className="note" aria-live="polite">
        {status === 'idle' ? '' : MESSAGES[status]}
      </div>
    </div>
  );
}
