import { useId, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Question, QuestionDifficulty } from '../../data/types';
import { useFocusRequest } from '../../shared/useFocusRequest';
import { Desempenho } from './components/Desempenho';
import { FormNovaQuestao } from './components/FormNovaQuestao';
import { Pratica } from './components/Pratica';
import { useQuestoes } from './hooks/useQuestoes';
import { DIFFICULTIES, filterQuestions, subjectsOf } from './utils/questoes';
import './questoes.css';

const LIST_TITLE_ID = 'questoes-lista-title';

export function QuestoesPage() {
  const { questions, attempts, loading, loadError, addQuestion, deleteQuestion, recordAttempt } =
    useQuestoes();
  const subjectId = useId();
  const difficultyId = useId();
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | ''>('');
  const [practicing, setPracticing] = useState<Question[] | null>(null);
  const [practiceStatus, setPracticeStatus] = useState('');
  const [pending, setPending] = useState<Question | null>(null);
  const [error, setError] = useState('');
  const focus = useFocusRequest();

  if (practicing) {
    return (
      <Pratica questions={practicing} onRecord={recordAttempt} onExit={() => setPracticing(null)} />
    );
  }

  function startPractice() {
    const pool = filterQuestions(questions, { subject, difficulty });
    if (!pool.length) {
      setPracticeStatus('Nenhuma questão com esse filtro.');
      return;
    }
    setPracticeStatus('');
    setPracticing(pool);
  }

  async function confirmDelete(id: string) {
    setPending(null);
    setError('');
    try {
      await deleteQuestion(id);
      focus(LIST_TITLE_ID);
    } catch {
      setError('Não foi possível excluir a questão. Tente novamente.');
    }
  }

  return (
    <>
      <Desempenho attempts={attempts} />
      <section className="card" aria-labelledby="praticar-title">
        <h2 id="praticar-title">Praticar</h2>
        <div className="row">
          <label htmlFor={subjectId} className="sr-only">
            Filtrar por matéria
          </label>
          <select id={subjectId} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Todas as matérias</option>
            {subjectsOf(questions).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <label htmlFor={difficultyId} className="sr-only">
            Filtrar por dificuldade
          </label>
          <select
            id={difficultyId}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty | '')}
          >
            <option value="">Qualquer dificuldade</option>
            {DIFFICULTIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn" onClick={startPractice}>
          Começar prática ▶
        </button>
        <div className="status" role="status">
          {practiceStatus}
        </div>
      </section>
      <FormNovaQuestao onSave={addQuestion} />
      <section className="card" aria-labelledby={LIST_TITLE_ID}>
        <h2 id={LIST_TITLE_ID} tabIndex={-1}>
          Todas as questões ({questions.length})
        </h2>
        {loadError ? (
          <div className="empty" role="alert">
            Não foi possível carregar as questões.
          </div>
        ) : loading ? null : questions.length ? (
          <ul className="questao-list">
            {questions.map((q) => (
              <li key={q.id} className="item">
                <div className="questao-info">
                  <span className="pill cat-outro">{q.subject}</span>{' '}
                  <span className="pill cat-aulas">{q.difficulty}</span>
                  <div className="questao-enunciado">{q.question}</div>
                </div>
                <button
                  type="button"
                  className="del"
                  aria-label={`Excluir questão: ${q.question}`}
                  onClick={() => setPending(q)}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">Nenhuma questão ainda.</div>
        )}
        <div className="status" role="alert">
          {error}
        </div>
      </section>
      {pending && (
        <ConfirmDialog
          title="Excluir questão?"
          message={`Tem certeza que deseja excluir esta questão? "${pending.question}"`}
          confirmLabel="Excluir"
          onCancel={() => setPending(null)}
          onConfirm={() => confirmDelete(pending.id)}
        />
      )}
    </>
  );
}
