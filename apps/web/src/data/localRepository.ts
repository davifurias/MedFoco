import {
  isRecord,
  normalizeEvent,
  normalizeFocusSession,
  normalizeNotebookEntry,
  normalizeTask,
} from './normalize';
import type { MedFocoRepository } from './repository';
import type { DailySuggestion, NewCalendarEvent, NewNotebookEntry, NewTask } from './types';

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
  /** Conteúdo salvo interpretado, ou `undefined` se estiver ilegível (JSON inválido). */
  function parse(key: string): unknown {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }

  /** Lista bruta como está salva (itens desconhecidos são preservados nas gravações). */
  function readRaw(key: string): unknown[] {
    const parsed = parse(key);
    return Array.isArray(parsed) ? parsed : [];
  }

  /**
   * Antes de gravar por cima de um conteúdo que não é uma lista legível, guarda uma cópia em
   * `<chave>:backup:<momento>`. Nenhum dado existente é descartado em silêncio.
   */
  function backupIfUnreadable(key: string, isExpectedShape: (parsed: unknown) => boolean): void {
    const raw = storage.getItem(key);
    if (raw === null) return;
    if (!isExpectedShape(parse(key))) storage.setItem(`${key}:backup:${now()}`, raw);
  }

  const isSchedule = (parsed: unknown): parsed is { text: string } =>
    isRecord(parsed) && typeof parsed.text === 'string';

  /** Itens válidos da lista; itens danificados são ignorados na leitura (mas não apagados). */
  function readList<T>(key: string, normalize: (raw: unknown) => T | null): T[] {
    return readRaw(key)
      .map(normalize)
      .filter((item): item is T => item !== null);
  }

  function writeRaw(key: string, items: unknown[]): void {
    backupIfUnreadable(key, Array.isArray);
    storage.setItem(key, JSON.stringify(items));
  }

  function append<T extends { id: string; createdAt: number }>(
    key: string,
    data: Omit<T, 'id' | 'createdAt'>,
  ): T {
    const item = { ...data, id: newId(), createdAt: now() } as T;
    writeRaw(key, [...readRaw(key), item]);
    return item;
  }

  function updateById(key: string, id: string, patch: Record<string, unknown>): void {
    writeRaw(
      key,
      readRaw(key).map((item) => (isRecord(item) && item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeById(key: string, id: string): void {
    writeRaw(
      key,
      readRaw(key).filter((item) => !(isRecord(item) && item.id === id)),
    );
  }

  return {
    async listTasks() {
      return readList(STORAGE_KEYS.tasks, normalizeTask);
    },
    async addTask(task: NewTask) {
      return append(STORAGE_KEYS.tasks, task);
    },
    async setTaskDone(id: string, done: boolean) {
      updateById(STORAGE_KEYS.tasks, id, { done });
    },
    async deleteTask(id: string) {
      removeById(STORAGE_KEYS.tasks, id);
    },

    async listEvents() {
      return readList(STORAGE_KEYS.events, normalizeEvent);
    },
    async addEvent(event: NewCalendarEvent) {
      return append(STORAGE_KEYS.events, event);
    },
    async deleteEvent(id: string) {
      removeById(STORAGE_KEYS.events, id);
    },

    async listNotebookEntries() {
      return readList(STORAGE_KEYS.notebook, normalizeNotebookEntry);
    },
    async addNotebookEntry(entry: NewNotebookEntry) {
      return append(STORAGE_KEYS.notebook, entry);
    },

    async listFocusSessions() {
      return readList(STORAGE_KEYS.focusSessions, normalizeFocusSession);
    },

    async getSchedule() {
      const parsed = parse(STORAGE_KEYS.schedule);
      return isSchedule(parsed) ? parsed.text : '';
    },
    async saveSchedule(text: string) {
      backupIfUnreadable(STORAGE_KEYS.schedule, isSchedule);
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
