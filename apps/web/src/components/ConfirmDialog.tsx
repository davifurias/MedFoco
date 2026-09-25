import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo de confirmação acessível. Abre com o foco em "Cancelar" (a opção segura),
 * fecha com Esc e devolve o foco para onde estava ao fechar.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  return (
    <div className="dialog-backdrop">
      <div
        className="dialog card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          // Mantém o foco dentro do diálogo (só há dois botões).
          if (e.key === 'Tab') {
            e.preventDefault();
            const next =
              document.activeElement === cancelRef.current ? confirmRef.current : cancelRef.current;
            next?.focus();
          }
        }}
      >
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        <p id={messageId}>{message}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="btn secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button ref={confirmRef} type="button" className="btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
