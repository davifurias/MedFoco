import { useId, useRef, useState, type FormEvent } from 'react';
import { CUSTOM_KEY, TECHNIQUES, checkCustom } from '../utils/timer';

interface FormTecnicaProps {
  onConfigure: (workMin: number, breakMin: number, subject: string) => void;
}

export function FormTecnica({ onConfigure }: FormTecnicaProps) {
  const ids = {
    technique: useId(),
    work: useId(),
    brk: useId(),
    subject: useId(),
    status: useId(),
  };
  const workRef = useRef<HTMLInputElement>(null);
  const breakRef = useRef<HTMLInputElement>(null);
  const [technique, setTechnique] = useState(TECHNIQUES[0]?.key ?? CUSTOM_KEY);
  const [work, setWork] = useState('25');
  const [brk, setBrk] = useState('5');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState<{ field: 'work' | 'break'; message: string } | null>(null);
  const isCustom = technique === CUSTOM_KEY;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isCustom) {
      const check = checkCustom(work, brk);
      if (!check.ok) {
        setError({ field: check.field, message: check.message });
        (check.field === 'work' ? workRef : breakRef).current?.focus();
        return;
      }
      setError(null);
      onConfigure(check.workMin, check.breakMin, subject.trim());
      return;
    }
    const chosen = TECHNIQUES.find((t) => t.key === technique) ?? TECHNIQUES[0];
    if (!chosen) return;
    setError(null);
    onConfigure(chosen.workMin, chosen.breakMin, subject.trim());
  }

  return (
    <section className="card" aria-labelledby="tecnica-title">
      <h2 id="tecnica-title" tabIndex={-1}>
        Escolha uma técnica
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={ids.technique} className="sr-only">
          Técnica
        </label>
        <select id={ids.technique} value={technique} onChange={(e) => setTechnique(e.target.value)}>
          {TECHNIQUES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
          <option value={CUSTOM_KEY}>Personalizado</option>
        </select>
        {isCustom && (
          <div className="row">
            <label htmlFor={ids.work} className="sr-only">
              Minutos de foco
            </label>
            <input
              id={ids.work}
              ref={workRef}
              type="number"
              inputMode="numeric"
              placeholder="Minutos de foco"
              value={work}
              aria-invalid={error?.field === 'work' || undefined}
              aria-describedby={error?.field === 'work' ? ids.status : undefined}
              onChange={(e) => setWork(e.target.value)}
            />
            <label htmlFor={ids.brk} className="sr-only">
              Minutos de pausa
            </label>
            <input
              id={ids.brk}
              ref={breakRef}
              type="number"
              inputMode="numeric"
              placeholder="Minutos de pausa"
              value={brk}
              aria-invalid={error?.field === 'break' || undefined}
              aria-describedby={error?.field === 'break' ? ids.status : undefined}
              onChange={(e) => setBrk(e.target.value)}
            />
          </div>
        )}
        <label htmlFor={ids.subject} className="sr-only">
          Matéria (opcional)
        </label>
        <input
          id={ids.subject}
          placeholder="Matéria (opcional, para o histórico)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <button type="submit" className="btn">
          Configurar
        </button>
        <div id={ids.status} className="status" role="alert">
          {error?.message}
        </div>
      </form>
    </section>
  );
}
