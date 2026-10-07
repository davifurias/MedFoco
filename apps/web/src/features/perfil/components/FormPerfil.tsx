import { useId, useState, type FormEvent } from 'react';
import type { Profile } from '../../../data/types';

interface FormPerfilProps {
  initial: Profile;
  onSave: (profile: Profile) => Promise<void>;
}

export function FormPerfil({ initial, onSave }: FormPerfilProps) {
  const ids = {
    curso: useId(),
    periodo: useId(),
    materias: useId(),
    metas: useId(),
    preferencias: useId(),
  };
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field: keyof Profile) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus('');
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed: Profile = {
      curso: values.curso.trim(),
      periodo: values.periodo.trim(),
      materias: values.materias.trim(),
      metas: values.metas.trim(),
      preferencias: values.preferencias.trim(),
    };
    setSaving(true);
    try {
      await onSave(trimmed);
      setValues(trimmed);
      setStatus('Salvo!');
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row">
        <label htmlFor={ids.curso} className="sr-only">
          Curso
        </label>
        <input
          id={ids.curso}
          placeholder="Curso"
          value={values.curso}
          onChange={(e) => set('curso')(e.target.value)}
        />
        <label htmlFor={ids.periodo} className="sr-only">
          Período
        </label>
        <input
          id={ids.periodo}
          placeholder="Período (ex: 4º período)"
          value={values.periodo}
          onChange={(e) => set('periodo')(e.target.value)}
        />
      </div>
      <label htmlFor={ids.materias} className="sr-only">
        Matérias que está cursando
      </label>
      <input
        id={ids.materias}
        placeholder="Matérias que está cursando (separadas por vírgula)"
        value={values.materias}
        onChange={(e) => set('materias')(e.target.value)}
      />
      <label htmlFor={ids.metas} className="sr-only">
        Suas metas
      </label>
      <textarea
        id={ids.metas}
        rows={2}
        placeholder="Suas metas (ex: passar em Neuro com nota alta, entrar na liga de cardio...)"
        value={values.metas}
        onChange={(e) => set('metas')(e.target.value)}
      />
      <label htmlFor={ids.preferencias} className="sr-only">
        Preferências de estudo
      </label>
      <textarea
        id={ids.preferencias}
        rows={2}
        placeholder="Preferências de estudo (ex: rendo mais de manhã, prefiro sessões curtas, gosto de estudar com questões...)"
        value={values.preferencias}
        onChange={(e) => set('preferencias')(e.target.value)}
      />
      <button type="submit" className="btn" disabled={saving}>
        Salvar perfil
      </button>
      <div className="status" aria-live="polite">
        {status}
      </div>
    </form>
  );
}
