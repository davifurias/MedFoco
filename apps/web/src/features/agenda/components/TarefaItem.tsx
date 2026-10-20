import type { Task } from '../../../data/types';
import { formatShortDate } from '../../../shared/date';
import { priorityBadge } from '../utils/agenda';
import { Icon } from '../../../components/Icon';

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
  const subjectId = `${checkboxId}-materia`;
  const priorityId = `${checkboxId}-prioridade`;
  const deadlineId = `${checkboxId}-prazo`;
  const badge = priorityBadge(task.priority);
  // Leitores de tela anunciam matéria, prioridade e prazo junto com a caixa de marcar.
  const describedBy =
    [task.subject && subjectId, badge && priorityId, task.deadline && deadlineId]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <li className="item">
      <label className="task-label" htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={task.done}
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          onChange={(e) => onToggle(task, e.target.checked)}
        />
        <span>
          <span id={titleId} className={task.done ? 'task-done' : undefined}>
            {task.title}
          </span>
          {task.subject && (
            <span id={subjectId} className="pill cat-outro task-subject">
              <span className="sr-only">Matéria: </span>
              {task.subject}
            </span>
          )}
          {badge && (
            <span id={priorityId} className={`pill task-priority ${badge.className}`}>
              <Icon name="prioridade" />
              <span className="sr-only">Prioridade </span>
              {badge.text}
            </span>
          )}
          {task.deadline && (
            <span id={deadlineId} className="meta task-deadline">
              Prazo: {formatShortDate(task.deadline)}
            </span>
          )}
        </span>
      </label>
      <button
        type="button"
        className="del"
        aria-label={`Excluir tarefa ${task.title}`}
        onClick={() => onDelete(task)}
      >
        <Icon name="remover" />
      </button>
    </li>
  );
}
