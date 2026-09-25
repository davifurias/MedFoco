import { useId, useState, type FormEvent } from 'react';

interface Props {
  id: string;
  onSave: (text: string) => Promise<void>;
}

/** Guarda a ideia no Caderno de Ideias pessoal (como no app original). */
export function FormIdeiaRapida({ id, onSave }: Props) {
  const inputId = useId();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
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
        Ideia para o caderno
      </label>
      <textarea
        id={inputId}
        rows={2}
        placeholder="Escreva a ideia, sem se preocupar em organizar"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <button type="submit" className="btn" disabled={saving}>
        Guardar no caderno
      </button>
      <div className="status" aria-live="polite">
        {status}
      </div>
    </form>
  );
}
