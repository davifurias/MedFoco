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

export type MaterialType = 'nota' | 'video';

/** Material de estudo (nota de texto ou aula em vídeo), agrupado por matéria. */
export interface Material {
  id: string;
  subject: string;
  title: string;
  notes: string;
  /** Assuntos-chave em minúsculas; ligam os materiais no Mapa. */
  tags: string[];
  type: MaterialType;
  /** Link http(s) do vídeo ('' quando não há). Sempre validado por toSafeHttpUrl. */
  videoLink: string;
  createdAt: number;
}

export type QuestionDifficulty = 'fácil' | 'médio' | 'difícil';

/** Questão de múltipla escolha com 4 alternativas; `correctIndex` (0 a 3) indica a correta. */
export interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  createdAt: number;
}

/** Resposta dada na prática; alimenta o desempenho por matéria e assunto. */
export interface Attempt {
  id: string;
  subject: string;
  topic: string;
  correct: boolean;
  /** Dia da resposta, no fuso horário local. */
  date: DateKey;
  createdAt: number;
}

export type NewTask = Omit<Task, 'id' | 'createdAt'>;
export type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'createdAt'>;
export type NewNotebookEntry = Omit<NotebookEntry, 'id' | 'createdAt'>;
export type NewMaterial = Omit<Material, 'id' | 'createdAt'>;
export type NewQuestion = Omit<Question, 'id' | 'createdAt'>;
export type NewAttempt = Omit<Attempt, 'id' | 'createdAt'>;
export type NewFocusSession = Omit<FocusSession, 'id' | 'createdAt'>;
