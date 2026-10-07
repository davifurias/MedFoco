import { useEffect, useRef } from 'react';
import { now } from '../../../shared/date';
import { formatClock, isFresh, type TimerState } from '../utils/timer';

interface TimerAtivoProps {
  timer: TimerState;
  seconds: number;
  onResume: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function TimerAtivo({ timer, seconds, onResume, onPause, onStop }: TimerAtivoProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isWork = timer.phase === 'work';
  const clock = formatClock(seconds);

  // Ao trocar de fase, o foco fica no título, que anuncia a nova fase.
  useEffect(() => {
    titleRef.current?.focus();
  }, [timer.phase]);

  return (
    <section className="card timer-card" aria-labelledby="timer-title">
      <h2 id="timer-title" ref={titleRef} tabIndex={-1}>
        {isWork ? '🍅 Foco' : '☕ Pausa'}
        {timer.subject ? ` · ${timer.subject}` : ''}
      </h2>
      <div className="timer-display" role="timer" aria-label={`Tempo restante: ${clock}`}>
        {clock}
      </div>
      <div className="row">
        {timer.running ? (
          <button type="button" className="btn secondary" onClick={onPause}>
            Pausar
          </button>
        ) : (
          <button type="button" className="btn" onClick={onResume}>
            {isFresh(timer, now().getTime()) ? 'Iniciar' : 'Continuar'}
          </button>
        )}
        <button type="button" className="btn secondary" onClick={onStop}>
          Encerrar
        </button>
      </div>
      <p className="meta">Ciclos completos hoje: {timer.cycles}</p>
    </section>
  );
}
