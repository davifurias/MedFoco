import { isValidDateKey, toLocalDateKey } from '../shared/date';
import { toSafeHttpUrl } from '../shared/url';
import { EVENT_CATEGORY_LABELS } from './categories';
import type {
  Attempt,
  CalendarEvent,
  EventCategory,
  FocusSession,
  Material,
  NotebookEntry,
  Question,
  QuestionDifficulty,
  Task,
  TaskPriority,
} from './types';

/**
 * Leitura tolerante de dados salvos. Cada função recebe um item bruto e devolve o item no
 * formato esperado, preenchendo campos opcionais ausentes com o valor padrão, ou `null` quando
 * o item não pode ser exibido (ex.: sem id, sem título ou com data inválida). Assim, um item
 * danificado não derruba a tela nem esconde os itens válidos.
 */

type RawRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';
const stringOr = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;
const timestamp = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const PRIORITIES: readonly TaskPriority[] = ['alta', 'média', 'baixa'];

export function normalizeTask(raw: unknown): Task | null {
  if (!isRecord(raw) || !nonEmptyString(raw.id) || !nonEmptyString(raw.title)) return null;
  return {
    id: raw.id,
    title: raw.title,
    subject: stringOr(raw.subject, ''),
    deadline: isValidDateKey(raw.deadline) ? raw.deadline : '',
    priority: PRIORITIES.includes(raw.priority as TaskPriority)
      ? (raw.priority as TaskPriority)
      : 'média',
    done: raw.done === true,
    createdAt: timestamp(raw.createdAt),
  };
}

export function normalizeEvent(raw: unknown): CalendarEvent | null {
  if (
    !isRecord(raw) ||
    !nonEmptyString(raw.id) ||
    !nonEmptyString(raw.title) ||
    !isValidDateKey(raw.date)
  ) {
    return null;
  }
  const category = raw.category as EventCategory;
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    category: category in EVENT_CATEGORY_LABELS ? category : 'outro',
    notes: stringOr(raw.notes, ''),
    createdAt: timestamp(raw.createdAt),
  };
}

export function normalizeNotebookEntry(raw: unknown): NotebookEntry | null {
  if (!isRecord(raw) || !nonEmptyString(raw.id) || !nonEmptyString(raw.text)) return null;
  return { id: raw.id, text: raw.text, createdAt: timestamp(raw.createdAt) };
}

export function normalizeFocusSession(raw: unknown): FocusSession | null {
  if (
    !isRecord(raw) ||
    !nonEmptyString(raw.id) ||
    (raw.type !== 'work' && raw.type !== 'break') ||
    !isValidDateKey(raw.date)
  ) {
    return null;
  }
  const minutes =
    typeof raw.minutes === 'number' && Number.isFinite(raw.minutes) && raw.minutes > 0
      ? raw.minutes
      : 0;
  return {
    id: raw.id,
    type: raw.type,
    minutes,
    subject: typeof raw.subject === 'string' ? raw.subject : null,
    date: raw.date,
    createdAt: timestamp(raw.createdAt),
  };
}

/** Assunto padrão quando o material não tem matéria (como no app original). */
export const DEFAULT_SUBJECT = 'Geral';

export function normalizeMaterial(raw: unknown): Material | null {
  if (!isRecord(raw) || !nonEmptyString(raw.id) || !nonEmptyString(raw.title)) return null;
  const type = raw.type === 'video' ? 'video' : 'nota';
  return {
    id: raw.id,
    subject: nonEmptyString(raw.subject) ? raw.subject.trim() : DEFAULT_SUBJECT,
    title: raw.title,
    notes: stringOr(raw.notes, ''),
    tags: Array.isArray(raw.tags) ? raw.tags.filter(nonEmptyString) : [],
    type,
    // Dados salvos podem ter sido alterados: só links http(s) válidos são mantidos.
    videoLink: (type === 'video' ? toSafeHttpUrl(raw.videoLink) : null) ?? '',
    createdAt: timestamp(raw.createdAt),
  };
}

const DIFFICULTIES: readonly QuestionDifficulty[] = ['fácil', 'médio', 'difícil'];

/** Questões precisam de enunciado e de exatamente 4 alternativas preenchidas. */
export function normalizeQuestion(raw: unknown): Question | null {
  if (!isRecord(raw) || !nonEmptyString(raw.id) || !nonEmptyString(raw.question)) return null;
  const options = raw.options;
  if (!Array.isArray(options) || options.length !== 4 || !options.every(nonEmptyString)) {
    return null;
  }
  const correct = raw.correctIndex;
  return {
    id: raw.id,
    subject: nonEmptyString(raw.subject) ? raw.subject.trim() : DEFAULT_SUBJECT,
    topic: stringOr(raw.topic, ''),
    difficulty: DIFFICULTIES.find((d) => d === raw.difficulty) ?? 'médio',
    question: raw.question,
    options: [options[0], options[1], options[2], options[3]] as Question['options'],
    correctIndex: typeof correct === 'number' && [0, 1, 2, 3].includes(correct) ? correct : 0,
    explanation: stringOr(raw.explanation, ''),
    createdAt: timestamp(raw.createdAt),
  };
}

export function normalizeAttempt(raw: unknown): Attempt | null {
  if (!isRecord(raw) || !nonEmptyString(raw.id) || typeof raw.correct !== 'boolean') return null;
  const createdAt = timestamp(raw.createdAt);
  return {
    id: raw.id,
    subject: nonEmptyString(raw.subject) ? raw.subject.trim() : DEFAULT_SUBJECT,
    topic: stringOr(raw.topic, ''),
    correct: raw.correct,
    date: isValidDateKey(raw.date) ? raw.date : toLocalDateKey(new Date(createdAt)),
    createdAt,
  };
}
