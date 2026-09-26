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
