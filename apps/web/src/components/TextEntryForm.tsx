import { useId, useRef, useState, type FormEvent } from 'react';

interface TextEntryFormProps {
  label: string;
  placeholder: string;
  submitLabel: string;
  rows?: number;
  onSave: (text: string) => Promise<void>;
}

/** Caixa de texto + botão para guardar uma ideia. Texto vazio não é salvo. */
export function TextEntryForm({
  label,
  placeholder,
  submitLabel,
  rows = 3,
  onSave,
}: TextEntryFormProps) {
  const ids = { text: useId(), status: useId() };
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setInvalid(true);
      setStatus('Escreva uma ideia antes de salvar.');
      textRef.current?.focus();
      return;
    }
    setInvalid(false);
    setSaving(true);
    setStatus('Salvando...');
    try {
      await onSave(trimmed);
      setText('');
      setStatus('Ideia salva!');
      textRef.current?.focus();
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor={ids.text} className="sr-only">
        {label}
      </label>
      <textarea
        id={ids.text}
        ref={textRef}
        rows={rows}
        placeholder={placeholder}
        value={text}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? ids.status : undefined}
        onChange={(e) => {
          setText(e.target.value);
          if (invalid) setInvalid(false);
        }}
      />
      <button type="submit" className="btn" disabled={saving}>
        {submitLabel}
      </button>
      <div id={ids.status} className="status" aria-live="polite">
        {status}
      </div>
    </form>
  );
}
