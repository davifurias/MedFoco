import type { CalendarEvent, Task, TaskPriority } from '../../../data/types';

/** Todos os eventos (passados inclusive), em ordem crescente de data; empate pela criação. */
export function sortEventsByDate(events: readonly CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/** Separa tarefas em pendentes e concluídas, cada grupo da mais recente para a mais antiga. */
export function splitTasks(tasks: readonly Task[]): { pending: Task[]; done: Task[] } {
  const newestFirst = [...tasks].sort((a, b) => b.createdAt - a.createdAt);
  return {
    pending: newestFirst.filter((task) => !task.done),
    done: newestFirst.filter((task) => task.done),
  };
}

/** Marcador visual de prioridade do app original: 🔴 alta, 🟡 média, nenhum para baixa. */
export function priorityMarker(priority: TaskPriority): string {
  if (priority === 'alta') return '🔴';
  if (priority === 'média') return '🟡';
  return '';
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  alta: 'Prioridade alta',
  média: 'Prioridade média',
  baixa: 'Prioridade baixa',
};

/** Verifica se o texto é uma data de calendário válida no formato AAAA-MM-DD. */
export function isValidDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
