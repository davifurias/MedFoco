import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { FormEventoRapido } from './FormEventoRapido';
import { FormIdeiaRapida } from './FormIdeiaRapida';
import { FormTarefaRapida } from './FormTarefaRapida';

type QuickForm = 'tarefa' | 'evento' | 'ideia';

const TOGGLES: { form: QuickForm; icon: string; label: string }[] = [
  { form: 'tarefa', icon: '✅', label: 'Tarefa' },
  { form: 'evento', icon: '📅', label: 'Evento' },
  { form: 'ideia', icon: '💡', label: 'Ideia' },
];

const FORM_ID: Record<QuickForm, string> = {
  tarefa: 'acao-rapida-tarefa',
  evento: 'acao-rapida-evento',
  ideia: 'acao-rapida-ideia',
};

interface Props {
  onAddTask: (title: string) => Promise<void>;
  onAddEvent: (title: string, date: string) => Promise<void>;
  onAddIdea: (text: string) => Promise<void>;
}

export function AcoesRapidasCard({ onAddTask, onAddEvent, onAddIdea }: Props) {
  const [open, setOpen] = useState<QuickForm | null>(null);
  const toggleRefs = useRef<Partial<Record<QuickForm, HTMLButtonElement | null>>>({});

  /** Salva, fecha o formulário e devolve o foco ao botão que o abriu. */
  function saveAndClose<A extends unknown[]>(form: QuickForm, save: (...args: A) => Promise<void>) {
    return async (...args: A) => {
      await save(...args);
      setOpen(null);
      toggleRefs.current[form]?.focus();
    };
  }

  return (
    <section className="card" aria-labelledby="acoes-title">
      <h2 id="acoes-title">Ações rápidas</h2>
      <div className="quick">
        {TOGGLES.map(({ form, icon, label }) => (
          <button
            key={form}
            ref={(el) => {
              toggleRefs.current[form] = el;
            }}
            type="button"
            aria-expanded={open === form}
            aria-controls={open === form ? FORM_ID[form] : undefined}
            className={open === form ? 'active' : undefined}
            onClick={() => setOpen((current) => (current === form ? null : form))}
          >
            <span aria-hidden="true">{icon}</span> {label}
          </button>
        ))}
        <Link to="/materias">
          <span aria-hidden="true">📄</span> Material
        </Link>
        <Link to="/assessora">
          <span aria-hidden="true">💬</span> Perguntar
        </Link>
      </div>
      {open === 'tarefa' && (
        <FormTarefaRapida id={FORM_ID.tarefa} onSave={saveAndClose('tarefa', onAddTask)} />
      )}
      {open === 'evento' && (
        <FormEventoRapido id={FORM_ID.evento} onSave={saveAndClose('evento', onAddEvent)} />
      )}
      {open === 'ideia' && (
        <FormIdeiaRapida id={FORM_ID.ideia} onSave={saveAndClose('ideia', onAddIdea)} />
      )}
    </section>
  );
}
