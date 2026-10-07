import { useId, useRef, useState, type FormEvent } from 'react';
import {
  AiUnavailableError,
  normalizeSteps,
  type CreateLessonQuestions,
  type GenerateLesson,
  type LessonStep,
} from '../services/assessora';

interface AulaGuiadaProps {
  generate: GenerateLesson;
  createQuestions: CreateLessonQuestions;
}

interface Lesson {
  topic: string;
  steps: LessonStep[];
}

export function AulaGuiada({ generate, createQuestions }: AulaGuiadaProps) {
  const ids = { topic: useId(), status: useId() };
  const topicRef = useRef<HTMLInputElement>(null);
  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const [topic, setTopic] = useState('');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [questionsStatus, setQuestionsStatus] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) {
      setInvalid(true);
      setStatus('Digite o assunto da aula.');
      topicRef.current?.focus();
      return;
    }
    setInvalid(false);
    setBusy(true);
    setStatus('Gerando aula...');
    setQuestionsStatus('');
    try {
      const steps = normalizeSteps(await generate(trimmed));
      if (steps.length) {
        setLesson({ topic: trimmed, steps });
        setIndex(0);
        setStatus('');
      } else {
        setStatus('Não consegui montar a aula agora. Tente de novo ou mude o assunto.');
      }
    } catch (error) {
      setStatus(
        error instanceof AiUnavailableError
          ? 'A aula guiada ainda não está disponível nesta versão do MedFoco.'
          : 'Não consegui gerar a aula agora. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }

  function go(delta: number) {
    setIndex((value) => value + delta);
    setQuestionsStatus('');
    // O foco acompanha o conteúdo: o botão que foi clicado muda ou some.
    setTimeout(() => stepTitleRef.current?.focus(), 0);
  }

  async function handleCreateQuestions() {
    if (!lesson) return;
    setQuestionsStatus('Criando questões...');
    try {
      await createQuestions(lesson.topic, lesson.steps);
      setQuestionsStatus('Questões adicionadas ao Banco de Questões ✅');
    } catch (error) {
      setQuestionsStatus(
        error instanceof AiUnavailableError
          ? 'Criar questões com IA ainda não está disponível nesta versão do MedFoco.'
          : 'Não consegui criar as questões agora. Tente novamente.',
      );
    }
  }

  const step = lesson?.steps[index];

  return (
    <section className="card" aria-labelledby="aula-title">
      <h2 id="aula-title">Aula guiada</h2>
      <p className="note">
        Escolha um assunto e receba uma aula dividida em passos curtos, com analogias e uma pergunta
        de checagem em cada etapa — em vez de um texto corrido.
      </p>
      <form className="row" onSubmit={handleSubmit} noValidate>
        <label htmlFor={ids.topic} className="sr-only">
          Assunto da aula
        </label>
        <input
          id={ids.topic}
          ref={topicRef}
          placeholder="Assunto (ex: Ciclo cardíaco)"
          value={topic}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? ids.status : undefined}
          onChange={(e) => {
            setTopic(e.target.value);
            setInvalid(false);
          }}
        />
        <button type="submit" className="btn" disabled={busy}>
          Gerar aula guiada
        </button>
      </form>
      <div id={ids.status} className="status" role="status">
        {status}
      </div>
      {lesson && step && (
        <div className="card lesson-step">
          <div className="meta">
            Passo {index + 1} de {lesson.steps.length} · {lesson.topic}
          </div>
          <h3 ref={stepTitleRef} tabIndex={-1}>
            {step.title}
          </h3>
          <p>{step.explanation}</p>
          {step.analogy && <p className="note">💡 Analogia: {step.analogy}</p>}
          {step.check && (
            <p>
              <strong>Checagem:</strong> {step.check}
            </p>
          )}
          {step.checkAnswer && (
            <details key={index}>
              <summary>Ver resposta</summary>
              <p>{step.checkAnswer}</p>
            </details>
          )}
          <div className="row">
            {index > 0 && (
              <button type="button" className="btn secondary" onClick={() => go(-1)}>
                Anterior
              </button>
            )}
            {index < lesson.steps.length - 1 ? (
              <button type="button" className="btn" onClick={() => go(1)}>
                Próximo
              </button>
            ) : (
              <button type="button" className="btn" onClick={handleCreateQuestions}>
                Criar questões desta aula ✨
              </button>
            )}
          </div>
          <div className="status" role="status">
            {questionsStatus}
          </div>
        </div>
      )}
    </section>
  );
}
