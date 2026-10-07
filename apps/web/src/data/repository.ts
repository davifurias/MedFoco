import type {
  AppIdea,
  Attempt,
  CalendarEvent,
  DailySuggestion,
  FocusSession,
  Material,
  NewAppIdea,
  NewAttempt,
  NewCalendarEvent,
  NewFocusSession,
  NewMaterial,
  NewNotebookEntry,
  NewQuestion,
  NewTask,
  NotebookEntry,
  Profile,
  Question,
  Task,
  Theme,
} from './types';

/**
 * Contrato de acesso aos dados do MedFoco. Os componentes dependem só desta interface;
 * hoje ela é implementada com armazenamento local (localRepository.ts) e, no futuro, poderá
 * ser implementada com o backend sem mudar a interface.
 */
export interface MedFocoRepository {
  listTasks(): Promise<Task[]>;
  addTask(task: NewTask): Promise<Task>;
  setTaskDone(id: string, done: boolean): Promise<void>;
  deleteTask(id: string): Promise<void>;

  listEvents(): Promise<CalendarEvent[]>;
  addEvent(event: NewCalendarEvent): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;

  listNotebookEntries(): Promise<NotebookEntry[]>;
  addNotebookEntry(entry: NewNotebookEntry): Promise<NotebookEntry>;
  deleteNotebookEntry(id: string): Promise<void>;

  listAppIdeas(): Promise<AppIdea[]>;
  addAppIdea(idea: NewAppIdea): Promise<AppIdea>;
  deleteAppIdea(id: string): Promise<void>;

  listMaterials(): Promise<Material[]>;
  addMaterial(material: NewMaterial): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;

  listQuestions(): Promise<Question[]>;
  addQuestion(question: NewQuestion): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;

  listAttempts(): Promise<Attempt[]>;
  addAttempt(attempt: NewAttempt): Promise<Attempt>;

  listFocusSessions(): Promise<FocusSession[]>;
  addFocusSession(session: NewFocusSession): Promise<FocusSession>;

  /** Perfil acadêmico; sem nada salvo, devolve o padrão (curso "Medicina"). */
  getProfile(): Promise<Profile>;
  saveProfile(profile: Profile): Promise<void>;

  getDailySuggestion(): Promise<DailySuggestion | null>;

  /** Tema escolhido; sem escolha salva (ou com valor inválido), devolve o escuro. */
  getTheme(): Promise<Theme>;
  saveTheme(theme: Theme): Promise<void>;

  /** Horários fixos da semana, em texto livre ('' quando nunca foram salvos). */
  getSchedule(): Promise<string>;
  saveSchedule(text: string): Promise<void>;
}
