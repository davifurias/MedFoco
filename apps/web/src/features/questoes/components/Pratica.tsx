import { useEffect, useRef, useState } from 'react';
import type { NewAttempt, Question } from '../../../data/types';
import { now, toLocalDateKey } from '../../../shared/date';
import { OPTION_LETTERS, shuffleOptions, type PracticeQuestion } from '../utils/questoes';

interface PraticaProps {
  questions: readonly Question[];
  onRecord: (attempt: NewAttempt) => Promise<void>;
  onExit: () => void;
}

/** Prática: uma questão por vez, com as alternativas embaralhadas. */
export function Pratica({ questions, onRecord, onExit }: PraticaProps) {
  // O embaralhamento é feito uma vez, ao começar a prática.
  const [pool] = useState<PracticeQuestion[]>(() => questions.map((q) => shuffleOptions(q)));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [recordError, setRecordError] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const finished = index >= pool.length;

  useEffect(() => {
    titleRef.current?.focus();
  }, [index]);

  if (finished) {
    return (
      <section className="card" aria-labelledby="resultado-title">
        <h2 id="resultado-title" ref={titleRef} tabIndex={-1}>
          Resultado
        </h2>
        <p className="resultado">
          {score} / {pool.length} corretas
        </p>
        <button type="button" className="btn" onClick={onExit}>
          Voltar
        </button>
      </section>
    );
  }

  const current = pool[index] as PracticeQuestion;
  const { question } = current;

  function answer(position: number) {
    if (answered !== null) return;
    const correct = position === current.correctPosition;
    setAnswered(position);
    setRecordError(false);
    if (correct) setScore((value) => value + 1);
    onRecord({
      subject: question.subject,
      topic: question.topic,
      correct,
      date: toLocalDateKey(now()),
    }).catch(() => setRecordError(true));
  }

  function next() {
    setIndex((value) => value + 1);
    setAnswered(null);
    setRecordError(false);
  }

  return (
    <section className="card" aria-labelledby="pergunta-title">
      <div className="meta">
        Questão {index + 1} de {pool.length} · {question.subject}
        {question.topic ? ` · ${question.topic}` : ''} · {question.difficulty}
      </div>
      <h2 id="pergunta-title" ref={titleRef} tabIndex={-1} className="pergunta">
        {question.question}
      </h2>
      <ul className="opcoes">
        {current.order.map((originalIndex, position) => {
          const isCorrect = position === current.correctPosition;
          const isChosen = position === answered;
          const state = answered === null ? '' : isCorrect ? ' correta' : isChosen ? ' errada' : '';
          return (
            <li key={originalIndex}>
              <button
                type="button"
                className={`btn secondary opcao${state}`}
                disabled={answered !== null}
                aria-pressed={answered === null ? undefined : isChosen}
                onClick={() => answer(position)}
              >
                <strong>{OPTION_LETTERS[position]})</strong> {question.options[originalIndex]}
                {answered !== null && isCorrect && <span aria-hidden="true"> ✔</span>}
                {answered !== null && isChosen && !isCorrect && <span aria-hidden="true"> ✖</span>}
                {answered !== null && isCorrect && <span className="sr-only"> (correta)</span>}
                {answered !== null && isChosen && !isCorrect && (
                  <span className="sr-only"> (sua resposta, incorreta)</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="note feedback" role="status">
        {answered !== null && (
          <>
            {answered === current.correctPosition ? '✅ Correto! ' : '❌ Não foi dessa vez. '}
            {question.explanation}
          </>
        )}
        {recordError && <div role="alert">Não foi possível registrar esta resposta.</div>}
      </div>
      {answered !== null && (
        <button type="button" className="btn" onClick={next}>
          {index + 1 < pool.length ? 'Próxima' : 'Ver resultado'}
        </button>
      )}
      <button type="button" className="btn secondary" onClick={onExit}>
        Sair da prática
      </button>
    </section>
  );
}
