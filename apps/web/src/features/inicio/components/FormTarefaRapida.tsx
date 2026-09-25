import { useId, useState, type FormEvent } from 'react';

interface Props {
  id: string;
  onSave: (title: string) => Promise<void>;
}

export function FormTarefaRapida({ id, onSave }: Props) {
  const inputId = useId();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) {
      setStatus('Escreva o que precisa fazer.');
      return;
    }
    setSaving(true);
    try {
      await onSave(value);
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form id={id} className="quick-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="sr-only">
        Título da tarefa
      </label>
      <input
        id={inputId}
        placeholder="O que precisa fazer?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <button type="submit" className="btn" disabled={saving}>
        Adicionar tarefa
      </button>
      <div className="status" aria-live="polite">
        {status}
      </div>
    </form>
  );
}
