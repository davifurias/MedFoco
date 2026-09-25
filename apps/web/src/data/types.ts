/**
 * Tipos de domínio do MedFoco. Os campos seguem a estrutura usada no app original
 * (legacy/MedFoco.html) para facilitar a migração futura dos dados para o backend.
 */

/** Data de calendário no formato AAAA-MM-DD, sempre no fuso horário local do usuário. */
export type DateKey = string;

export type EventCategory = 'trabalho' | 'provas' | 'ferias' | 'aulas' | 'outro';

export type TaskPriority = 'alta' | 'média' | 'baixa';

export interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: DateKey | '';
  priority: TaskPriority;
  done: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: DateKey;
  category: EventCategory;
  notes: string;
  createdAt: number;
}

/** Item do Caderno de Ideias pessoal (não é o mural compartilhado "Ideias do App"). */
export interface NotebookEntry {
  id: string;
  text: string;
  createdAt: number;
}

/** Sessão do timer de Foco: 'work' é tempo focado; 'break' é pausa. */
export interface FocusSession {
  id: string;
  type: 'work' | 'break';
  minutes: number;
  subject: string | null;
  date: DateKey;
  createdAt: number;
}

export interface DailySuggestion {
  date: DateKey;
  text: string;
}

export type NewTask = Omit<Task, 'id' | 'createdAt'>;
export type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'createdAt'>;
export type NewNotebookEntry = Omit<NotebookEntry, 'id' | 'createdAt'>;
