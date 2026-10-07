import { useId, useRef, useState, type FormEvent } from 'react';
import type { NewQuestion, Question, QuestionDifficulty } from '../../../data/types';
import { DIFFICULTIES, OPTION_LETTERS } from '../utils/questoes';

type Invalid = 'subject' | 'question' | 'options' | null;

export function FormNovaQuestao({ onSave }: { onSave: (question: NewQuestion) => Promise<void> }) {
  const ids = {
    subject: useId(),
    topic: useId(),
    difficulty: useId(),
    question: useId(),
    correct: useId(),
    explanation: useId(),
    status: useId(),
  };
  const optionIds = [useId(), useId(), useId(), useId()];
  const subjectRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('fácil');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState('');
  const [invalid, setInvalid] = useState<Invalid>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = options.map((option) => option.trim());
    const firstEmpty = trimmed.findIndex((option) => !option);
    const problem: Invalid = !subject.trim()
      ? 'subject'
      : !question.trim()
        ? 'question'
        : firstEmpty >= 0
          ? 'options'
          : null;
    if (problem) {
      setInvalid(problem);
      setStatus('Preencha matéria, enunciado e as 4 alternativas.');
      if (problem === 'subject') subjectRef.current?.focus();
      else if (problem === 'question') questionRef.current?.focus();
      else optionRefs.current[firstEmpty]?.focus();
      return;
    }
    setInvalid(null);
    setSaving(true);
    setStatus('Salvando...');
    try {
      await onSave({
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        question: question.trim(),
        options: trimmed as Question['options'],
        correctIndex,
        explanation: explanation.trim(),
      });
      setSubject('');
      setTopic('');
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
      setExplanation('');
      setStatus('Questão salva!');
      subjectRef.current?.focus();
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const describe = (field: Exclude<Invalid, null>) => (invalid === field ? ids.status : undefined);

  return (
    <section className="card" aria-labelledby="nova-questao-title">
      <h2 id="nova-questao-title">Adicionar questão</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <label htmlFor={ids.subject} className="sr-only">
            Matéria
          </label>
          <input
            id={ids.subject}
            ref={subjectRef}
            placeholder="Matéria"
            value={subject}
            aria-invalid={invalid === 'subject' || undefined}
            aria-describedby={describe('subject')}
            onChange={(e) => setSubject(e.target.value)}
          />
          <label htmlFor={ids.topic} className="sr-only">
            Assunto
          </label>
          <input
            id={ids.topic}
            placeholder="Assunto"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <label htmlFor={ids.difficulty} className="sr-only">
          Dificuldade
        </label>
        <select
          id={ids.difficulty}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
        >
          {DIFFICULTIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label htmlFor={ids.question} className="sr-only">
          Enunciado da questão
        </label>
        <textarea
          id={ids.question}
          ref={questionRef}
          rows={2}
          placeholder="Enunciado da questão"
          value={question}
          aria-invalid={invalid === 'question' || undefined}
          aria-describedby={describe('question')}
          onChange={(e) => setQuestion(e.target.value)}
        />
        {OPTION_LETTERS.map((letter, index) => (
          <div key={letter}>
            <label htmlFor={optionIds[index]} className="sr-only">
              Alternativa {letter}
            </label>
            <input
              id={optionIds[index]}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              placeholder={`Alternativa ${letter}`}
              value={options[index]}
              aria-invalid={(invalid === 'options' && !options[index]?.trim()) || undefined}
              aria-describedby={describe('options')}
              onChange={(e) =>
                setOptions((current) => current.map((o, i) => (i === index ? e.target.value : o)))
              }
            />
          </div>
        ))}
        <label htmlFor={ids.correct}>Alternativa correta</label>
        <select
          id={ids.correct}
          value={correctIndex}
          onChange={(e) => setCorrectIndex(Number(e.target.value))}
        >
          {OPTION_LETTERS.map((letter, index) => (
            <option key={letter} value={index}>
              Alternativa {letter}
            </option>
          ))}
        </select>
        <label htmlFor={ids.explanation} className="sr-only">
          Explicação da resposta correta
        </label>
        <textarea
          id={ids.explanation}
          rows={2}
          placeholder="Explicação da resposta correta"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <button type="submit" className="btn" disabled={saving}>
          Salvar questão
        </button>
        <div id={ids.status} className="status" aria-live="polite">
          {status}
        </div>
      </form>
    </section>
  );
}
