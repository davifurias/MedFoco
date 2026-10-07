import { describe, expect, it } from 'vitest';
import { normalizeSteps } from '../services/assessora';
import { SHORTCUTS, classifyFile } from './anexos';

describe('classifyFile', () => {
  it.each([
    ['notas.txt', 'text/plain', 'text'],
    ['resumo.md', 'text/markdown', 'text'],
    ['resumo.MD', '', 'text'],
    ['NOTAS.TXT', '', 'text'],
    ['foto.png', 'image/png', 'image'],
    ['x.jpg', 'image/jpeg', 'image'],
    ['livro.pdf', 'application/pdf', 'unsupported'],
    ['planilha.xlsx', '', 'unsupported'],
    ['txt', '', 'unsupported'],
  ])('%s (%s) → %s', (name, type, expected) => {
    expect(classifyFile({ name, type })).toBe(expected);
  });
});

describe('normalizeSteps', () => {
  it('mantém passos válidos e completa campos ausentes', () => {
    expect(normalizeSteps([{ title: 'T', explanation: 'E' }])).toEqual([
      { title: 'T', explanation: 'E', analogy: '', check: '', checkAnswer: '' },
    ]);
  });
  it('descarta lixo e conteúdo que não é texto', () => {
    expect(normalizeSteps([null, 'x', 7, {}, { title: 3, explanation: {} }])).toEqual([]);
    expect(normalizeSteps('não é lista')).toEqual([]);
    expect(normalizeSteps(undefined)).toEqual([]);
  });
});

describe('atalhos', () => {
  it('não mencionam condição de saúde do estudante', () => {
    for (const shortcut of SHORTCUTS) {
      expect(`${shortcut.label} ${shortcut.prompt}`).not.toMatch(/tdah/i);
    }
  });
});
