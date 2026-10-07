import { describe, expect, it } from 'vitest';
import type { Attempt, Question } from '../../../data/types';
import {
  computePerformance,
  filterQuestions,
  performanceLevel,
  shuffleOptions,
  subjectsOf,
} from './questoes';

const attempt = (subject: string, topic: string, correct: boolean): Attempt => ({
  id: `${subject}${topic}${Math.random()}`,
  subject,
  topic,
  correct,
  date: '2026-10-07',
  createdAt: 1,
});

const question = (id: string, extra: Partial<Question> = {}): Question => ({
  id,
  subject: 'Cardiologia',
  topic: '',
  difficulty: 'fácil',
  question: id,
  options: ['a', 'b', 'c', 'd'],
  correctIndex: 0,
  explanation: '',
  createdAt: 1,
  ...extra,
});

describe('computePerformance', () => {
  it('agrupa por matéria + assunto e ordena do pior para o melhor acerto', () => {
    const result = computePerformance([
      attempt('Cardio', 'IC', true),
      attempt('Cardio', 'IC', false),
      attempt('Cardio', 'IC', false),
      attempt('Neuro', '', true),
      attempt('Cardio', '', false),
    ]);
    expect(result.map((r) => [r.subject, r.topic, r.correct, r.total, r.pct])).toEqual([
      ['Cardio', '', 0, 1, 0],
      ['Cardio', 'IC', 1, 3, 33],
      ['Neuro', '', 1, 1, 100],
    ]);
  });
  it('não mistura assuntos que só diferem pela junção dos textos', () => {
    expect(computePerformance([attempt('a|', 'b', true), attempt('a', '|b', true)])).toHaveLength(
      2,
    );
  });
  it('vazio sem respostas', () => {
    expect(computePerformance([])).toEqual([]);
  });
});

describe('performanceLevel', () => {
  it('usa os limites de 60% e 80%', () => {
    expect([0, 59, 60, 79, 80, 100].map(performanceLevel)).toEqual([
      'baixo',
      'baixo',
      'medio',
      'medio',
      'alto',
      'alto',
    ]);
  });
});

describe('filterQuestions e subjectsOf', () => {
  const all = [
    question('1'),
    question('2', { subject: 'Neuro', difficulty: 'difícil' }),
    question('3', { difficulty: 'difícil' }),
  ];
  it('filtra por matéria e dificuldade, em conjunto ou separados', () => {
    expect(filterQuestions(all, { subject: '', difficulty: '' })).toHaveLength(3);
    expect(filterQuestions(all, { subject: 'Cardiologia', difficulty: '' })).toHaveLength(2);
    expect(filterQuestions(all, { subject: '', difficulty: 'difícil' })).toHaveLength(2);
    expect(filterQuestions(all, { subject: 'Cardiologia', difficulty: 'difícil' })).toHaveLength(1);
    expect(filterQuestions(all, { subject: 'Neuro', difficulty: 'fácil' })).toHaveLength(0);
  });
  it('lista matérias distintas em ordem alfabética', () => {
    expect(subjectsOf(all)).toEqual(['Cardiologia', 'Neuro']);
  });
});

describe('shuffleOptions', () => {
  it('é uma permutação e aponta onde está a alternativa correta', () => {
    for (let correctIndex = 0; correctIndex < 4; correctIndex++) {
      for (const random of [() => 0, () => 0.5, () => 0.99, Math.random]) {
        const shuffled = shuffleOptions(question('q', { correctIndex }), random);
        expect([...shuffled.order].sort()).toEqual([0, 1, 2, 3]);
        expect(shuffled.order[shuffled.correctPosition]).toBe(correctIndex);
      }
    }
  });
});
