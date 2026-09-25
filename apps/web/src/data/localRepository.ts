import type { MedFocoRepository } from './repository';
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

/** O mínimo de `Storage` (localStorage) de que o repositório precisa. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Chaves versionadas: permitem migrar o formato dos dados no futuro. */
export const STORAGE_KEYS = {
  tasks: 'medfoco:v1:tasks',
  events: 'medfoco:v1:events',
  notebook: 'medfoco:v1:notebook',
  focusSessions: 'medfoco:v1:focusSessions',
  dailySuggestion: 'medfoco:v1:dailySuggestion',
  schedule: 'medfoco:v1:schedule',
} as const;

type IdCrypto = Pick<Crypto, 'getRandomValues'> & { randomUUID?: () => string };

/**
 * Gera um identificador único (UUID v4). Usa `crypto.randomUUID()` quando existe; como ele só
 * está disponível em contexto seguro (HTTPS ou localhost), cai para `crypto.getRandomValues()`,
 * que funciona também ao abrir o app por `http://<IP-da-rede>` (ex.: testando no celular).
 */
export function newId(cryptoImpl: IdCrypto = globalThis.crypto): string {
  if (typeof cryptoImpl.randomUUID === 'function') return cryptoImpl.randomUUID();

  const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // versão 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Persistência local temporária (até existir backend). Os dados ficam só neste navegador e
 * nunca são enviados a nenhum serviço externo.
 */
export function createLocalRepository(
  storage: KeyValueStorage,
  now: () => number = Date.now,
): MedFocoRepository {
  function readList<T>(key: string): T[] {
    const raw = storage.getItem(key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  function writeList<T>(key: string, items: T[]): void {
    storage.setItem(key, JSON.stringify(items));
  }

  function append<T extends { id: string; createdAt: number }>(
    key: string,
    data: Omit<T, 'id' | 'createdAt'>,
  ): T {
    const item = { ...data, id: newId(), createdAt: now() } as T;
    writeList(key, [...readList<T>(key), item]);
    return item;
  }

  return {
    async listTasks() {
      return readList<Task>(STORAGE_KEYS.tasks);
    },
    async addTask(task: NewTask) {
      return append<Task>(STORAGE_KEYS.tasks, task);
    },
    async setTaskDone(id: string, done: boolean) {
      const tasks = readList<Task>(STORAGE_KEYS.tasks);
      writeList(
        STORAGE_KEYS.tasks,
        tasks.map((task) => (task.id === id ? { ...task, done } : task)),
      );
    },
    async deleteTask(id: string) {
      const tasks = readList<Task>(STORAGE_KEYS.tasks);
      writeList(
        STORAGE_KEYS.tasks,
        tasks.filter((task) => task.id !== id),
      );
    },

    async listEvents() {
      return readList<CalendarEvent>(STORAGE_KEYS.events);
    },
    async addEvent(event: NewCalendarEvent) {
      return append<CalendarEvent>(STORAGE_KEYS.events, event);
    },
    async deleteEvent(id: string) {
      const events = readList<CalendarEvent>(STORAGE_KEYS.events);
      writeList(
        STORAGE_KEYS.events,
        events.filter((event) => event.id !== id),
      );
    },

    async listNotebookEntries() {
      return readList<NotebookEntry>(STORAGE_KEYS.notebook);
    },
    async addNotebookEntry(entry: NewNotebookEntry) {
      return append<NotebookEntry>(STORAGE_KEYS.notebook, entry);
    },

    async listFocusSessions() {
      return readList<FocusSession>(STORAGE_KEYS.focusSessions);
    },

    async getSchedule() {
      const raw = storage.getItem(STORAGE_KEYS.schedule);
      if (!raw) return '';
      try {
        const parsed = JSON.parse(raw) as { text?: unknown } | null;
        return typeof parsed?.text === 'string' ? parsed.text : '';
      } catch {
        return '';
      }
    },
    async saveSchedule(text: string) {
      storage.setItem(STORAGE_KEYS.schedule, JSON.stringify({ text }));
    },

    async getDailySuggestion() {
      const raw = storage.getItem(STORAGE_KEYS.dailySuggestion);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as Partial<DailySuggestion> | null;
        return parsed && typeof parsed.date === 'string' && typeof parsed.text === 'string'
          ? { date: parsed.date, text: parsed.text }
          : null;
      } catch {
        return null;
      }
    },
  };
}

/** Armazenamento em memória: usado em testes e quando o navegador bloqueia o localStorage. */
export function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

/** localStorage do navegador, ou memória se ele estiver indisponível (ex.: modo privado). */
export function getBrowserStorage(): KeyValueStorage {
  try {
    const probe = 'medfoco:probe';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}
