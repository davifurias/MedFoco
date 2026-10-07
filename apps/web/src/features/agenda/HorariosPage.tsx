import { useId, useState, type FormEvent } from 'react';
import { useHorarios } from './hooks/useHorarios';

export function HorariosPage() {
  const { text, loading, loadError, save } = useHorarios();

  return (
    <section className="card" aria-labelledby="horarios-title">
      <h2 id="horarios-title">Seus horários fixos da semana</h2>
      <p className="note">
        Escreva livremente sua rotina (aulas, estágio, trabalho, etc). A Assessora usa isso para te
        ajudar a encaixar os estudos.
      </p>
      {loadError ? (
        <div className="empty" role="alert">
          Não foi possível carregar seus horários.
        </div>
      ) : loading ? null : (
        <FormHorarios initialText={text} onSave={save} />
      )}
    </section>
  );
}

function FormHorarios({
  initialText,
  onSave,
}: {
  initialText: string;
  onSave: (text: string) => Promise<void>;
}) {
  const textareaId = useId();
  const [value, setValue] = useState(initialText);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const trimmed = value.trim();
      await onSave(trimmed);
      setValue(trimmed);
      setStatus('Salvo!');
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor={textareaId} className="sr-only">
        Horários fixos da semana
      </label>
      <textarea
        id={textareaId}
        rows={6}
        placeholder="Ex: Seg 8h-12h aula clínica; Ter 14h-18h estágio; Qua livre à tarde..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus('');
        }}
      />
      <button type="submit" className="btn" disabled={saving}>
        Salvar horários
      </button>
      <div className="status" aria-live="polite">
        {status}
      </div>
    </form>
  );
}
