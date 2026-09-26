import { describe, expect, it } from 'vitest';
import {
  normalizeEvent,
  normalizeFocusSession,
  normalizeNotebookEntry,
  normalizeTask,
} from './normalize';

describe('normalizeTask', () => {
  const valid = {
    id: 't1',
    title: 'Ler',
    subject: 'Cardio',
    deadline: '2026-10-01',
    priority: 'alta',
    done: true,
    createdAt: 5,
  };

  it('mantém uma tarefa válida', () => {
    expect(normalizeTask(valid)).toEqual(valid);
  });

  it('completa campos opcionais ausentes ou inválidos com valores padrão', () => {
    expect(
      normalizeTask({
        id: 't1',
        title: 'Ler',
        deadline: '31/12/2026',
        priority: 'urgente',
        done: 'sim',
      }),
    ).toEqual({
      id: 't1',
      title: 'Ler',
      subject: '',
      deadline: '',
      priority: 'média',
      done: false,
      createdAt: 0,
    });
  });

  it('descarta itens sem id ou sem título', () => {
    for (const raw of [
      null,
      42,
      'x',
      [],
      {},
      { id: 't1' },
      { title: 'Ler' },
      { id: '', title: 'Ler' },
      { id: 't1', title: '   ' },
    ]) {
      expect(normalizeTask(raw)).toBeNull();
    }
  });
});

describe('normalizeEvent', () => {
  it('mantém um evento válido e corrige categoria desconhecida para "outro"', () => {
    expect(
      normalizeEvent({ id: 'e1', title: 'Prova', date: '2026-10-01', category: 'festa' }),
    ).toEqual({
      id: 'e1',
      title: 'Prova',
      date: '2026-10-01',
      category: 'outro',
      notes: '',
      createdAt: 0,
    });
  });

  it('descarta eventos sem data válida', () => {
    for (const date of [undefined, '', '2026-02-30', '01/10/2026', 20261001]) {
      expect(normalizeEvent({ id: 'e1', title: 'Prova', date })).toBeNull();
    }
  });
});

describe('normalizeNotebookEntry e normalizeFocusSession', () => {
  it('aceitam itens válidos e descartam inválidos', () => {
    expect(normalizeNotebookEntry({ id: 'n1', text: 'ideia', createdAt: 1 })).toEqual({
      id: 'n1',
      text: 'ideia',
      createdAt: 1,
    });
    expect(normalizeNotebookEntry({ id: 'n1', text: '' })).toBeNull();
    expect(
      normalizeFocusSession({ id: 's1', type: 'work', minutes: 25, date: '2026-09-25' }),
    ).toEqual({
      id: 's1',
      type: 'work',
      minutes: 25,
      subject: null,
      date: '2026-09-25',
      createdAt: 0,
    });
    expect(
      normalizeFocusSession({ id: 's1', type: 'pausa', minutes: 5, date: '2026-09-25' }),
    ).toBeNull();
    expect(
      normalizeFocusSession({ id: 's1', type: 'work', minutes: -3, date: '2026-09-25' })?.minutes,
    ).toBe(0);
  });
});
