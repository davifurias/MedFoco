import { useState } from 'react';
import type { DailySuggestion, DateKey } from '../../../data/types';
import { AiUnavailableError, type GenerateDailySuggestion } from '../services/sugestaoDoDia';

type Status = 'idle' | 'loading' | 'unavailable' | 'error';

const MESSAGES: Record<Exclude<Status, 'idle'>, string> = {
  loading: 'Pensando...',
  unavailable:
    'A sugestão com IA ainda não está disponível nesta versão do MedFoco. Ela chegará em uma próxima atualização.',
  error: 'Não consegui gerar a sugestão agora. Tente novamente mais tarde.',
};

interface SugestaoDoDiaCardProps {
  suggestion: DailySuggestion | null;
  today: DateKey;
  generate: GenerateDailySuggestion;
}

export function SugestaoDoDiaCard({ suggestion, today, generate }: SugestaoDoDiaCardProps) {
  const [status, setStatus] = useState<Status>('idle');
  const todaysText = suggestion?.date === today ? suggestion.text : null;

  async function handleGenerate() {
    setStatus('loading');
    try {
      await generate();
      // A partir da Fase 3: salvar e exibir a sugestão gerada.
      setStatus('idle');
    } catch (error) {
      setStatus(error instanceof AiUnavailableError ? 'unavailable' : 'error');
    }
  }

  return (
    <section className="card" aria-labelledby="sugestao-title">
      <h2 id="sugestao-title">Sugestão da IA para hoje</h2>
      {todaysText ? (
        <p className="sugestao-text">{todaysText}</p>
      ) : (
        <p className="note">
          Levo em conta seu perfil, horários, tarefas e provas para sugerir o foco de hoje.
        </p>
      )}
      <button
        type="button"
        className={todaysText ? 'btn secondary' : 'btn'}
        onClick={handleGenerate}
        disabled={status === 'loading'}
      >
        {todaysText ? 'Gerar de novo 🔄' : 'Gerar sugestão do dia ✨'}
      </button>
      <div className="status" aria-live="polite">
        {status === 'idle' ? '' : MESSAGES[status]}
      </div>
    </section>
  );
}
