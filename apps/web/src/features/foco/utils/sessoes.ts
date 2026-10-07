import type { DateKey, FocusSession } from '../../../data/types';

/** Quantas sessões aparecem no histórico recente. */
export const HISTORY_LIMIT = 10;

/** Minutos de foco do dia; pausas não contam. */
export function focusMinutesOn(sessions: readonly FocusSession[], date: DateKey): number {
  return sessions
    .filter((s) => s.type === 'work' && s.date === date)
    .reduce((total, s) => total + s.minutes, 0);
}

/** Mais recentes primeiro (empate: a gravada por último). */
export function recentSessions(sessions: readonly FocusSession[]): FocusSession[] {
  return sessions
    .map((session, index) => ({ session, index }))
    .sort((a, b) => b.session.createdAt - a.session.createdAt || b.index - a.index)
    .slice(0, HISTORY_LIMIT)
    .map(({ session }) => session);
}
