import type {
  CalendarEvent,
  DailySuggestion,
  FocusSession,
  NewCalendarEvent,
  NewNotebookEntry,
  NewTask,
  NotebookEntry,
  Task,
} from './types';

/**
 * Contrato de acesso aos dados do MedFoco. Os componentes dependem só desta interface;
 * hoje ela é implementada com armazenamento local (localRepository.ts) e, no futuro, poderá
 * ser implementada com o backend sem mudar a interface.
 */
export interface MedFocoRepository {
  listTasks(): Promise<Task[]>;
  addTask(task: NewTask): Promise<Task>;

  listEvents(): Promise<CalendarEvent[]>;
  addEvent(event: NewCalendarEvent): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;

  listNotebookEntries(): Promise<NotebookEntry[]>;
  addNotebookEntry(entry: NewNotebookEntry): Promise<NotebookEntry>;

  listFocusSessions(): Promise<FocusSession[]>;

  getDailySuggestion(): Promise<DailySuggestion | null>;
}
