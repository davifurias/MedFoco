import { useId, useRef, useState, type FormEvent } from 'react';
import type { MaterialType, NewMaterial } from '../../../data/types';
import { toSafeHttpUrl } from '../../../shared/url';
import { DEFAULT_SUBJECT, parseTags } from '../utils/materias';

const TYPES: { type: MaterialType; label: string }[] = [
  { type: 'nota', label: '📝 Nota' },
  { type: 'video', label: '🎥 Aula em vídeo' },
];

type Invalid = 'title' | 'link' | null;

export function FormNovoMaterial({ onSave }: { onSave: (material: NewMaterial) => Promise<void> }) {
  const ids = {
    subject: useId(),
    title: useId(),
    link: useId(),
    notes: useId(),
    tags: useId(),
    status: useId(),
    hint: useId(),
  };
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<MaterialType>('nota');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('');
  const [invalid, setInvalid] = useState<Invalid>(null);
  const [saving, setSaving] = useState(false);
  const isVideo = type === 'video';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setInvalid('title');
      setStatus('Dê um título ao material.');
      titleRef.current?.focus();
      return;
    }
    let videoLink = '';
    if (isVideo && link.trim()) {
      const safe = toSafeHttpUrl(link);
      if (!safe) {
        setInvalid('link');
        setStatus('Informe um link válido, começando com http:// ou https://.');
        linkRef.current?.focus();
        return;
      }
      videoLink = safe;
    }
    setInvalid(null);
    setSaving(true);
    setStatus('Salvando...');
    try {
      await onSave({
        subject: subject.trim() || DEFAULT_SUBJECT,
        title: trimmedTitle,
        notes: notes.trim(),
        tags: parseTags(tags),
        type,
        videoLink,
      });
      setSubject('');
      setTitle('');
      setLink('');
      setNotes('');
      setTags('');
      setStatus('Material salvo!');
      titleRef.current?.focus();
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card" aria-labelledby="novo-material-title">
      <h2 id="novo-material-title">Adicionar material</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="quick" role="group" aria-label="Tipo de material">
          {TYPES.map((option) => (
            <button
              key={option.type}
              type="button"
              aria-pressed={type === option.type}
              onClick={() => setType(option.type)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label htmlFor={ids.subject} className="sr-only">
          Matéria
        </label>
        <input
          id={ids.subject}
          placeholder="Matéria (ex: Cardiologia)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <label htmlFor={ids.title} className="sr-only">
          Título do material
        </label>
        <input
          id={ids.title}
          ref={titleRef}
          placeholder="Título do material"
          value={title}
          aria-invalid={invalid === 'title' || undefined}
          aria-describedby={invalid === 'title' ? ids.status : undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            if (invalid === 'title') setInvalid(null);
          }}
        />
        {isVideo && (
          <>
            <label htmlFor={ids.link} className="sr-only">
              Link do vídeo
            </label>
            <input
              id={ids.link}
              ref={linkRef}
              type="text"
              inputMode="url"
              placeholder="Link do YouTube"
              value={link}
              aria-invalid={invalid === 'link' || undefined}
              aria-describedby={invalid === 'link' ? ids.status : ids.hint}
              onChange={(e) => {
                setLink(e.target.value);
                if (invalid === 'link') setInvalid(null);
              }}
            />
            <p id={ids.hint} className="note">
              O app não consegue assistir ao vídeo sozinho. Cole abaixo a transcrição, ou um resumo
              do que o vídeo ensina: ela fica guardada para o resumo com IA, quando estiver
              disponível.
            </p>
          </>
        )}
        <label htmlFor={ids.notes} className="sr-only">
          {isVideo ? 'Transcrição ou resumo do vídeo' : 'Anotações'}
        </label>
        <textarea
          id={ids.notes}
          rows={3}
          placeholder={
            isVideo
              ? 'Cole aqui a transcrição/resumo do vídeo'
              : 'Cole aqui um resumo, anotação ou texto sobre o assunto'
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <label htmlFor={ids.tags} className="sr-only">
          Assuntos-chave
        </label>
        <input
          id={ids.tags}
          placeholder="Assuntos-chave separados por vírgula (ex: coração, valvas, sopro) — usado para conectar no Mapa"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button type="submit" className="btn" disabled={saving}>
          Salvar material
        </button>
        <div id={ids.status} className="status" aria-live="polite">
          {status}
        </div>
      </form>
    </section>
  );
}
