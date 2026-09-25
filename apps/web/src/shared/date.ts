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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Converte AAAA-MM-DD em Date à meia-noite local (sem interpretar como UTC). */
export function fromDateKey(key: DateKey): Date {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
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
