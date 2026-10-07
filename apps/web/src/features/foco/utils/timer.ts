/**
 * Lógica pura do timer de Foco. O tempo é calculado pelo horário real de término da fase (e não
 * descontando 1 segundo a cada "tick"), então continua certo com a tela bloqueada ou a aba em
 * segundo plano. Pausas do usuário não contam como tempo focado.
 */

export type Phase = 'work' | 'break';

export interface Technique {
  key: string;
  label: string;
  workMin: number;
  breakMin: number;
}

export const TECHNIQUES: readonly Technique[] = [
  { key: 'pomodoro', label: 'Pomodoro (25/5)', workMin: 25, breakMin: 5 },
  { key: 'pomodoro_longo', label: 'Pomodoro longo (50/10)', workMin: 50, breakMin: 10 },
  { key: 'cinquenta_dezessete', label: '52/17', workMin: 52, breakMin: 17 },
  { key: 'curto', label: 'Foco curto (15/3)', workMin: 15, breakMin: 3 },
];

export const CUSTOM_KEY = 'custom';
export const WORK_RANGE = { min: 1, max: 180 } as const;
export const BREAK_RANGE = { min: 1, max: 60 } as const;

export type CustomCheck =
  | { ok: true; workMin: number; breakMin: number }
  | { ok: false; field: 'work' | 'break'; message: string };

const isWhole = (text: string) => /^\d+$/.test(text.trim());

/** Valida os minutos personalizados: números inteiros dentro dos limites. */
export function checkCustom(work: string, brk: string): CustomCheck {
  if (!isWhole(work) || Number(work) < WORK_RANGE.min || Number(work) > WORK_RANGE.max) {
    return {
      ok: false,
      field: 'work',
      message: `Minutos de foco: informe um número inteiro de ${WORK_RANGE.min} a ${WORK_RANGE.max}.`,
    };
  }
  if (!isWhole(brk) || Number(brk) < BREAK_RANGE.min || Number(brk) > BREAK_RANGE.max) {
    return {
      ok: false,
      field: 'break',
      message: `Minutos de pausa: informe um número inteiro de ${BREAK_RANGE.min} a ${BREAK_RANGE.max}.`,
    };
  }
  return { ok: true, workMin: Number(work), breakMin: Number(brk) };
}

export interface TimerState {
  phase: Phase;
  workMin: number;
  breakMin: number;
  subject: string;
  /** Focos concluídos desde que o timer foi configurado. */
  cycles: number;
  running: boolean;
  /** Tempo que falta na fase atual, enquanto parado. */
  remainingMs: number;
  /** Instante (ms) em que a fase atual termina, enquanto rodando. */
  endsAt: number;
}

export interface CompletedPhase {
  phase: Phase;
  minutes: number;
  /** Instante (ms) em que a fase terminou. */
  endedAt: number;
}

const MINUTE = 60_000;
/** Limite de fases recuperadas de uma vez (ex.: aba esquecida aberta por muito tempo). */
const MAX_CATCH_UP = 100;

export const phaseMs = (timer: TimerState, phase: Phase = timer.phase) =>
  (phase === 'work' ? timer.workMin : timer.breakMin) * MINUTE;

export function createTimer(workMin: number, breakMin: number, subject: string): TimerState {
  return {
    phase: 'work',
    workMin,
    breakMin,
    subject,
    cycles: 0,
    running: false,
    remainingMs: workMin * MINUTE,
    endsAt: 0,
  };
}

export function remainingMs(timer: TimerState, nowMs: number): number {
  return timer.running ? Math.max(0, timer.endsAt - nowMs) : timer.remainingMs;
}

/** Segundos inteiros que faltam (arredonda para cima: "00:00" só quando acabou). */
export function remainingSeconds(timer: TimerState, nowMs: number): number {
  return Math.ceil(remainingMs(timer, nowMs) / 1000);
}

export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Ainda não começou a fase atual (mostra "Iniciar" em vez de "Continuar"). */
export const isFresh = (timer: TimerState, nowMs: number) =>
  remainingMs(timer, nowMs) === phaseMs(timer);

export function resume(timer: TimerState, nowMs: number): TimerState {
  if (timer.running) return timer;
  return { ...timer, running: true, endsAt: nowMs + timer.remainingMs };
}

export function pause(timer: TimerState, nowMs: number): TimerState {
  if (!timer.running) return timer;
  return { ...timer, running: false, remainingMs: remainingMs(timer, nowMs) };
}

/**
 * Conclui as fases cujo horário já passou e passa sozinho para a seguinte (foco → pausa → foco).
 * Devolve as fases concluídas, para registrar no histórico.
 */
export function advance(
  timer: TimerState,
  nowMs: number,
): { timer: TimerState; completed: CompletedPhase[] } {
  const completed: CompletedPhase[] = [];
  let current = timer;
  while (current.running && nowMs >= current.endsAt && completed.length < MAX_CATCH_UP) {
    const finished = current.phase;
    completed.push({
      phase: finished,
      minutes: finished === 'work' ? current.workMin : current.breakMin,
      endedAt: current.endsAt,
    });
    const next: Phase = finished === 'work' ? 'break' : 'work';
    current = {
      ...current,
      phase: next,
      cycles: current.cycles + (finished === 'work' ? 1 : 0),
      endsAt: current.endsAt + phaseMs(current, next),
    };
  }
  if (current.running && nowMs >= current.endsAt) {
    current = { ...current, endsAt: nowMs + phaseMs(current) };
  }
  return { timer: current, completed };
}

/** Minutos inteiros já focados na fase atual (0 numa pausa); pausas do usuário não contam. */
export function focusedMinutes(timer: TimerState, nowMs: number): number {
  if (timer.phase !== 'work') return 0;
  return Math.max(0, Math.floor((phaseMs(timer) - remainingMs(timer, nowMs)) / MINUTE));
}
