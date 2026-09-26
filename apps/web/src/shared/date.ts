import type { DateKey } from '../data/types';

/**
 * Datas do MedFoco: SEMPRE no fuso horário local do usuário.
 * (O app original usava UTC, o que fazia "hoje" virar amanhã à noite no Brasil.)
 */

/** Momento atual. Único ponto do app que consulta o relógio. */
export function now(): Date {
  return new Date();
}

/** Converte um momento em data local AAAA-MM-DD. */
export function toLocalDateKey(date: Date): DateKey {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cria a data à meia-noite local. Usa setFullYear porque `new Date(ano, …)` trata os anos
 * 0–99 como 1900–1999.
 */
function localMidnight(year: number, monthIndex: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, monthIndex, day);
  return date;
}

/** Converte AAAA-MM-DD em Date à meia-noite local (sem interpretar como UTC). */
export function fromDateKey(key: DateKey): Date {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return localMidnight(year, month - 1, day);
}

/** Verifica se o texto é uma data de calendário existente no formato AAAA-MM-DD. */
export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = localMidnight(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Ex.: "sexta-feira, 25 de setembro". */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

/** Ex.: "25 de set. de 2026" — mesmo formato das datas de eventos no app original. */
export function formatShortDate(key: DateKey): string {
  const date = fromDateKey(key);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
