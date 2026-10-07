import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRepository } from '../../data/RepositoryContext';
import type { FocusSession, NewFocusSession } from '../../data/types';
import { beep } from '../../shared/beep';
import { now, toLocalDateKey } from '../../shared/date';
import {
  advance,
  createTimer,
  focusedMinutes,
  pause,
  remainingSeconds,
  resume,
  type CompletedPhase,
  type TimerState,
} from './utils/timer';

interface FocoValue {
  timer: TimerState | null;
  /** Segundos que faltam na fase atual (0 sem timer). */
  seconds: number;
  sessions: FocusSession[];
  /** Aviso em texto sobre o último acontecimento (fase concluída, sessão encerrada). */
  notice: string;
  recordError: boolean;
  configure(workMin: number, breakMin: number, subject: string): void;
  resume(): void;
  pause(): void;
  stop(): void;
}

const FocoContext = createContext<FocoValue | null>(null);

const TICK_MS = 500;

/**
 * Guarda o timer acima das telas: ele continua contando ao navegar para outra área do app.
 * (Ao fechar ou recarregar a página, o timer é perdido, como no app original.)
 */
export function FocoProvider({ children }: { children: ReactNode }) {
  const repository = useRepository();
  const timerRef = useRef<TimerState | null>(null);
  const [timer, setTimerState] = useState<TimerState | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [notice, setNotice] = useState('');
  const [recordError, setRecordError] = useState(false);
  // Depois de qualquer gravação, a carga inicial (se ainda não chegou) já está desatualizada.
  const changedRef = useRef(false);

  useEffect(() => {
    let active = true;
    repository
      .listFocusSessions()
      .then((list) => {
        if (active && !changedRef.current) setSessions(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [repository]);

  const commit = useCallback((next: TimerState | null, nowMs = now().getTime()) => {
    timerRef.current = next;
    setTimerState(next);
    setSeconds(next ? remainingSeconds(next, nowMs) : 0);
  }, []);

  const record = useCallback(
    async (session: NewFocusSession) => {
      try {
        const saved = await repository.addFocusSession(session);
        changedRef.current = true;
        setSessions((current) => [...current, saved]);
      } catch {
        setRecordError(true);
      }
    },
    [repository],
  );

  const recordCompleted = useCallback(
    (completed: CompletedPhase[], subject: string) => {
      for (const phase of completed) {
        void record({
          type: phase.phase,
          minutes: phase.minutes,
          subject: subject || null,
          date: toLocalDateKey(new Date(phase.endedAt)),
        });
      }
    },
    [record],
  );

  const tick = useCallback(() => {
    const current = timerRef.current;
    if (!current?.running) return;
    const nowMs = now().getTime();
    const { timer: next, completed } = advance(current, nowMs);
    commit(next, nowMs);
    const last = completed[completed.length - 1];
    if (last) {
      recordCompleted(completed, current.subject);
      beep();
      setNotice(
        last.phase === 'work'
          ? '🍅 Foco concluído! Hora da pausa.'
          : '☕ Pausa concluída! De volta ao foco.',
      );
    }
  }, [commit, recordCompleted]);

  const running = timer?.running ?? false;
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(tick, TICK_MS);
    // Ao voltar para a aba, atualiza na hora em vez de esperar o próximo ciclo.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, tick]);

  const value = useMemo<FocoValue>(
    () => ({
      timer,
      seconds,
      sessions,
      notice,
      recordError,
      configure(workMin, breakMin, subject) {
        setNotice('');
        setRecordError(false);
        commit(createTimer(workMin, breakMin, subject));
      },
      resume() {
        const current = timerRef.current;
        if (!current) return;
        setNotice('');
        commit(resume(current, now().getTime()));
      },
      pause() {
        const current = timerRef.current;
        if (!current) return;
        setNotice('');
        commit(pause(current, now().getTime()));
      },
      stop() {
        const current = timerRef.current;
        if (!current) return;
        const nowMs = now().getTime();
        const minutes = focusedMinutes(current, nowMs);
        commit(null);
        if (minutes >= 1) {
          void record({
            type: 'work',
            minutes,
            subject: current.subject || null,
            date: toLocalDateKey(new Date(nowMs)),
          });
          setNotice(`Sessão encerrada. ${minutes} min de foco registrados.`);
        } else {
          setNotice('Sessão encerrada.');
        }
      },
    }),
    [timer, seconds, sessions, notice, recordError, commit, record],
  );

  return <FocoContext.Provider value={value}>{children}</FocoContext.Provider>;
}

export function useFoco(): FocoValue {
  const value = useContext(FocoContext);
  if (!value) throw new Error('useFoco precisa estar dentro de <FocoProvider>');
  return value;
}
