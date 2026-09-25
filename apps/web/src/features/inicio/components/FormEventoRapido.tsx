import { useId, useState, type FormEvent } from 'react';

interface Props {
  id: string;
  onSave: (title: string, date: string) => Promise<void>;
}

export function FormEventoRapido({ id, onSave }: Props) {
  const titleId = useId();
  const dateId = useId();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || !date) {
      setStatus('Preencha título e data.');
      return;
    }
    setSaving(true);
    try {
      await onSave(value, date);
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form id={id} className="quick-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={titleId} className="sr-only">
        Título do evento
      </label>
      <input
        id={titleId}
        placeholder="Título do evento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <label htmlFor={dateId} className="sr-only">
        Data do evento
      </label>
      <input id={dateId} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button type="submit" className="btn" disabled={saving}>
        Adicionar evento
      </button>
      <div className="status" aria-live="polite">
        {status}
      </div>
    </form>
  );
}
