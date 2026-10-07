import type { Attempt, Question, QuestionDifficulty } from '../../../data/types';

export const DIFFICULTIES: { value: QuestionDifficulty; label: string }[] = [
  { value: 'fácil', label: 'Fácil' },
  { value: 'médio', label: 'Médio' },
  { value: 'difícil', label: 'Difícil' },
];

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

/** Quantos assuntos aparecem em "Seu desempenho" (os de menor acerto). */
export const PERFORMANCE_LIMIT = 3;

export interface Performance {
  subject: string;
  topic: string;
  total: number;
  correct: number;
  /** Percentual de acerto, arredondado. */
  pct: number;
}

/** Acertos por matéria + assunto, do menor percentual para o maior (como no app original). */
export function computePerformance(attempts: readonly Attempt[]): Performance[] {
  const groups = new Map<string, Omit<Performance, 'pct'>>();
  for (const attempt of attempts) {
    const key = `${attempt.subject}\u0000${attempt.topic}`;
    const group = groups.get(key) ?? {
      subject: attempt.subject,
      topic: attempt.topic,
      total: 0,
      correct: 0,
    };
    group.total += 1;
    if (attempt.correct) group.correct += 1;
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, pct: Math.round((100 * group.correct) / group.total) }))
    .sort(
      (a, b) =>
        a.pct - b.pct ||
        a.subject.localeCompare(b.subject, 'pt-BR') ||
        a.topic.localeCompare(b.topic, 'pt-BR'),
    );
}

/** Abaixo de 60% pede atenção; abaixo de 80% é razoável; daí em diante é bom. */
export function performanceLevel(pct: number): 'baixo' | 'medio' | 'alto' {
  return pct < 60 ? 'baixo' : pct < 80 ? 'medio' : 'alto';
}

export interface PracticeFilter {
  subject: string;
  difficulty: QuestionDifficulty | '';
}

export function filterQuestions(questions: readonly Question[], filter: PracticeFilter) {
  return questions.filter(
    (q) =>
      (!filter.subject || q.subject === filter.subject) &&
      (!filter.difficulty || q.difficulty === filter.difficulty),
  );
}

export interface PracticeQuestion {
  question: Question;
  /** Índices originais das alternativas, na ordem em que aparecem na tela. */
  order: number[];
  /** Posição, na tela, da alternativa correta. */
  correctPosition: number;
}

/** Embaralha as alternativas (Fisher-Yates); `random` é injetável para os testes. */
export function shuffleOptions(
  question: Question,
  random: () => number = Math.random,
): PracticeQuestion {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return { question, order, correctPosition: order.indexOf(question.correctIndex) };
}

/** Subtítulo de matérias distintas, em ordem alfabética. */
export function subjectsOf(questions: readonly Question[]): string[] {
  return [...new Set(questions.map((q) => q.subject))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
