import { useId, useRef, useState, type FormEvent } from 'react';
import { EVENT_CATEGORY_LABELS } from '../../../data/categories';
import type { EventCategory, NewCalendarEvent } from '../../../data/types';
import { isValidDateKey } from '../../../shared/date';

/** Categoria inicial da Agenda, como no app original (primeira opção da lista). */
const DEFAULT_CATEGORY: EventCategory = 'trabalho';

export function FormNovoEvento({ onSave }: { onSave: (event: NewCalendarEvent) => Promise<void> }) {
  const ids = { title: useId(), date: useId(), category: useId(), notes: useId() };
  const statusId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState({ title: false, date: false });
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<EventCategory>(DEFAULT_CATEGORY);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = title.trim();
    const missing = { title: !value, date: !isValidDateKey(date) };
    if (missing.title || missing.date) {
      setInvalid(missing);
      setStatus('Preencha título e data.');
      (missing.title ? titleRef : dateRef).current?.focus();
      return;
    }
    setInvalid({ title: false, date: false });
    setSaving(true);
    setStatus('Salvando...');
    try {
      await onSave({ title: value, date, category, notes: notes.trim() });
      setTitle('');
      setDate('');
      setCategory(DEFAULT_CATEGORY);
      setNotes('');
      setStatus('');
      titleRef.current?.focus();
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card" aria-labelledby="novo-evento-title">
      <h2 id="novo-evento-title">Novo evento</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div>
            <label htmlFor={ids.title} className="sr-only">
              Título do evento
            </label>
            <input
              id={ids.title}
              ref={titleRef}
              placeholder="Título (ex: Prova de Anatomia)"
              value={title}
              aria-invalid={invalid.title || undefined}
              aria-describedby={invalid.title ? statusId : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                setInvalid((v) => ({ ...v, title: false }));
              }}
            />
          </div>
          <div>
            <label htmlFor={ids.date} className="sr-only">
              Data do evento
            </label>
            <input
              id={ids.date}
              ref={dateRef}
              type="date"
              value={date}
              aria-invalid={invalid.date || undefined}
              aria-describedby={invalid.date ? statusId : undefined}
              onChange={(e) => {
                setDate(e.target.value);
                setInvalid((v) => ({ ...v, date: false }));
              }}
            />
          </div>
        </div>
        <label htmlFor={ids.category} className="sr-only">
          Categoria
        </label>
        <select
          id={ids.category}
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
        >
          {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor={ids.notes} className="sr-only">
          Observação
        </label>
        <input
          id={ids.notes}
          placeholder="Observação (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="btn" disabled={saving}>
          Adicionar ao calendário
        </button>
        <div id={statusId} className="status" aria-live="polite">
          {status}
        </div>
      </form>
    </section>
  );
}
