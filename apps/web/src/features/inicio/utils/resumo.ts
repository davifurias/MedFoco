import type { CalendarEvent, DateKey, FocusSession, Task } from '../../../data/types';

/** Quantidade máxima de eventos exibidos no cartão "Próximos eventos". */
export const UPCOMING_EVENTS_LIMIT = 5;

/** "Bom dia" antes das 12h, "Boa tarde" das 12h às 17h59, "Boa noite" a partir das 18h. */
export function greeting(hour: number, name?: string | null): string {
  const base = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName ? `${base}, ${firstName}` : base;
}

export function countPendingTasks(tasks: readonly Task[]): number {
  return tasks.filter((task) => !task.done).length;
}

/** Todos os eventos de hoje em diante, em ordem de data crescente. */
export function upcomingEvents(events: readonly CalendarEvent[], today: DateKey): CalendarEvent[] {
  return events
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/** Minutos efetivamente focados hoje (sessões de trabalho; pausas não contam). */
export function focusedMinutesToday(sessions: readonly FocusSession[], today: DateKey): number {
  return sessions
    .filter((session) => session.date === today && session.type === 'work')
    .reduce((total, session) => total + (session.minutes || 0), 0);
}
