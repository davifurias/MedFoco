import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository } from '../../../data/RepositoryContext';
import type { Attempt, NewAttempt, NewQuestion, Question } from '../../../data/types';

/** Questões e respostas já dadas, com cadastro, exclusão e registro de respostas. */
export function useQuestoes() {
  const repository = useRepository();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Depois de qualquer gravação, a carga inicial (se ainda não chegou) já está desatualizada.
  const changedRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([repository.listQuestions(), repository.listAttempts()])
      .then(([questionList, attemptList]) => {
        if (!active || changedRef.current) return;
        setQuestions(questionList);
        setAttempts(attemptList);
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository]);

  const reloadQuestions = useCallback(async () => {
    changedRef.current = true;
    setQuestions(await repository.listQuestions());
    setLoadError(false);
    setLoading(false);
  }, [repository]);

  const addQuestion = useCallback(
    async (question: NewQuestion) => {
      await repository.addQuestion(question);
      await reloadQuestions();
    },
    [repository, reloadQuestions],
  );

  const deleteQuestion = useCallback(
    async (id: string) => {
      await repository.deleteQuestion(id);
      await reloadQuestions();
    },
    [repository, reloadQuestions],
  );

  const recordAttempt = useCallback(
    async (attempt: NewAttempt) => {
      const saved = await repository.addAttempt(attempt);
      changedRef.current = true;
      setAttempts((current) => [...current, saved]);
    },
    [repository],
  );

  return { questions, attempts, loading, loadError, addQuestion, deleteQuestion, recordAttempt };
}
