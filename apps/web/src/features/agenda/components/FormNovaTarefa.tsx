import { useId, useRef, useState, type FormEvent } from 'react';
import type { NewTask, TaskPriority } from '../../../data/types';
import { isValidDateKey } from '../utils/agenda';

const DEFAULT_PRIORITY: TaskPriority = 'média';

export function FormNovaTarefa({ onSave }: { onSave: (task: NewTask) => Promise<void> }) {
  const ids = { title: useId(), subject: useId(), deadline: useId(), priority: useId() };
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_PRIORITY);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) {
      setStatus('Escreva o que precisa fazer.');
      return;
    }
    if (deadline && !isValidDateKey(deadline)) {
      setStatus('Informe uma data de prazo válida.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: value,
        subject: subject.trim(),
        deadline,
        priority,
        done: false,
      });
      setTitle('');
      setSubject('');
      setDeadline('');
      setPriority(DEFAULT_PRIORITY);
      setStatus('');
      titleRef.current?.focus();
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card" aria-labelledby="nova-tarefa-title">
      <h2 id="nova-tarefa-title">Nova tarefa</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={ids.title} className="sr-only">
          Título da tarefa
        </label>
        <input
          id={ids.title}
          ref={titleRef}
          placeholder="O que precisa fazer (ex: Ler capítulo 4 de Cardio)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="row">
          <div>
            <label htmlFor={ids.subject} className="sr-only">
              Matéria (opcional)
            </label>
            <input
              id={ids.subject}
              placeholder="Matéria (opcional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={ids.deadline} className="sr-only">
              Prazo (opcional)
            </label>
            <input
              id={ids.deadline}
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={ids.priority} className="sr-only">
              Prioridade
            </label>
            <select
              id={ids.priority}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="média">Prioridade média</option>
              <option value="alta">Prioridade alta</option>
              <option value="baixa">Prioridade baixa</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn" disabled={saving}>
          Adicionar tarefa
        </button>
        <div className="status" aria-live="polite">
          {status}
        </div>
      </form>
    </section>
  );
}
