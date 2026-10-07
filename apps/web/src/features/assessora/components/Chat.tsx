import { useId, useRef, useState, type ChangeEvent } from 'react';
import type { Material } from '../../../data/types';
import { AiUnavailableError, type Attachment, type SendChatMessage } from '../services/assessora';
import {
  ACCEPTED_FILES,
  EXPLAIN_IMAGE_PROMPT,
  MAX_IMAGE_BYTES,
  MAX_MESSAGES,
  MAX_TEXT_BYTES,
  SHORTCUTS,
  UNSUPPORTED_MESSAGE,
  classifyFile,
  explainMaterialPrompt,
  tooLargeMessage,
} from '../utils/anexos';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

interface ChatProps {
  /** Materiais que têm anotação (podem ser explicados pela assessora). */
  materials: readonly Material[];
  send: SendChatMessage;
}

export function Chat({ materials, send }: ChatProps) {
  const ids = { select: useId(), file: useId(), input: useId() };
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [materialId, setMaterialId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function clearAttachment() {
    setAttachment(null);
    setMaterialId('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function pickMaterial(id: string) {
    setMaterialId(id);
    if (fileRef.current) fileRef.current.value = '';
    const material = materials.find((m) => m.id === id);
    if (!material) {
      setAttachment(null);
      return;
    }
    setStatus('');
    setAttachment({ kind: 'text', title: material.title, content: material.notes });
    setText(explainMaterialPrompt(material.title));
  }

  async function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = classifyFile(file);
    setMaterialId('');
    setStatus('');
    if (kind === 'unsupported') {
      setAttachment(null);
      e.target.value = '';
      setStatus(UNSUPPORTED_MESSAGE);
      return;
    }
    if (file.size > (kind === 'text' ? MAX_TEXT_BYTES : MAX_IMAGE_BYTES)) {
      setAttachment(null);
      e.target.value = '';
      setStatus(tooLargeMessage(kind));
      return;
    }
    if (kind === 'image') {
      setAttachment({ kind: 'image', title: file.name, file });
      setText(EXPLAIN_IMAGE_PROMPT);
      return;
    }
    try {
      setAttachment({ kind: 'text', title: file.name, content: await readAsText(file) });
      setText(explainMaterialPrompt(file.name));
    } catch {
      setAttachment(null);
      setStatus('Não foi possível ler o arquivo. Tente outro.');
    }
  }

  async function submit(message: string, fromShortcut: boolean) {
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus('Escreva uma mensagem.');
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setStatus('Enviando...');
    try {
      const answer = await send({ text: trimmed, attachment });
      setMessages((current) =>
        [
          ...current,
          { role: 'user', content: trimmed } as Message,
          { role: 'assistant', content: answer } as Message,
        ].slice(-MAX_MESSAGES),
      );
      if (!fromShortcut) setText('');
      clearAttachment();
      setStatus('');
    } catch (error) {
      setStatus(
        error instanceof AiUnavailableError
          ? 'A assessora ainda não está disponível nesta versão do MedFoco. Sua mensagem não foi enviada.'
          : 'Não consegui responder agora. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card chatbox" aria-labelledby="chat-title">
      <h2 id="chat-title">Assessora de estudos</h2>
      <div className="quick" role="group" aria-label="Atalhos">
        {SHORTCUTS.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            className={'primary' in shortcut ? 'quick-primary' : undefined}
            disabled={busy}
            onClick={() => submit(shortcut.prompt, true)}
          >
            {shortcut.label}
          </button>
        ))}
      </div>
      <div className="row">
        <label htmlFor={ids.select} className="sr-only">
          Explicar um material salvo
        </label>
        <select id={ids.select} value={materialId} onChange={(e) => pickMaterial(e.target.value)}>
          <option value="">📚 Explicar um material salvo...</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.subject} — {material.title}
            </option>
          ))}
        </select>
        <label htmlFor={ids.file} className="btn secondary file-button">
          💻 Enviar do computador
          <input
            id={ids.file}
            ref={fileRef}
            type="file"
            accept={ACCEPTED_FILES}
            className="sr-only"
            onChange={pickFile}
          />
        </label>
      </div>
      {attachment && (
        <div className="quick">
          <span className="pill cat-aulas anexo">
            <span aria-hidden="true">📎 {attachment.kind === 'image' ? '🖼️' : '📄'}</span>
            <span className="sr-only">Anexo: </span>
            {attachment.title}
            <button type="button" className="anexo-remover" onClick={clearAttachment}>
              <span aria-hidden="true">✕</span>
              <span className="sr-only">Remover anexo</span>
            </button>
          </span>
        </div>
      )}
      <div className="chatmsgs" role="log" aria-label="Conversa" aria-live="polite">
        {messages.length ? (
          messages.map((message, i) => (
            <div key={i} className={`bubble ${message.role === 'user' ? 'user' : 'assist'}`}>
              <span className="sr-only">{message.role === 'user' ? 'Você: ' : 'Assessora: '}</span>
              {message.content}
            </div>
          ))
        ) : (
          <div className="empty">
            Pergunte algo, anexe um material acima, ou peça um plano de estudos.
          </div>
        )}
      </div>
      <div className="status" role="status">
        {status}
      </div>
      <form
        className="chatinput"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(text, false);
        }}
      >
        <label htmlFor={ids.input} className="sr-only">
          Mensagem para a assessora
        </label>
        <textarea
          id={ids.input}
          ref={inputRef}
          placeholder="Escreva sua mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit(text, false);
            }
          }}
        />
        <button type="submit" className="btn" disabled={busy}>
          Enviar
        </button>
      </form>
    </section>
  );
}
