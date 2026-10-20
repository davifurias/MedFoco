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

/**
 * Selo de prioridade: texto + bandeira, nunca só cor. Alta (vermelho) e média (âmbar); a baixa não
 * tem selo, como no app original.
 */
export function priorityBadge(priority: TaskPriority): { text: string; className: string } | null {
  if (priority === 'alta') return { text: 'Alta', className: 'cat-provas' };
  if (priority === 'média') return { text: 'Média', className: 'cat-trabalho' };
  return null;
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  alta: 'Prioridade alta',
  média: 'Prioridade média',
  baixa: 'Prioridade baixa',
};
