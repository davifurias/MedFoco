import type { Task } from '../../../data/types';
import { formatShortDate } from '../../../shared/date';
import { PRIORITY_LABELS, priorityMarker } from '../utils/agenda';

export function taskCheckboxId(id: string): string {
  return `tarefa-${id}`;
}

interface TarefaItemProps {
  task: Task;
  onToggle: (task: Task, done: boolean) => void;
  onDelete: (task: Task) => void;
}

/** Linha de tarefa: marcar como concluída, matéria, prioridade, prazo e excluir. */
export function TarefaItem({ task, onToggle, onDelete }: TarefaItemProps) {
  const checkboxId = taskCheckboxId(task.id);
  const titleId = `${checkboxId}-titulo`;
  const marker = priorityMarker(task.priority);

  return (
    <li className="item">
      <label className="task-label" htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={task.done}
          aria-labelledby={titleId}
          onChange={(e) => onToggle(task, e.target.checked)}
        />
        <span>
          <span id={titleId} className={task.done ? 'task-done' : undefined}>
            {task.title}
          </span>
          {task.subject && <span className="pill cat-outro task-subject">{task.subject}</span>}
          {marker && (
            <span className="task-priority" role="img" aria-label={PRIORITY_LABELS[task.priority]}>
              {marker}
            </span>
          )}
          {task.deadline && (
            <span className="meta task-deadline">Prazo: {formatShortDate(task.deadline)}</span>
          )}
        </span>
      </label>
      <button
        type="button"
        className="del"
        aria-label={`Excluir tarefa ${task.title}`}
        onClick={() => onDelete(task)}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </li>
  );
}
