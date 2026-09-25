import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Task } from '../../data/types';
import { useFocusRequest } from '../../shared/useFocusRequest';
import { FormNovaTarefa } from './components/FormNovaTarefa';
import { OrganizarSemana } from './components/OrganizarSemana';
import { TarefaItem, taskCheckboxId } from './components/TarefaItem';
import { useTarefas } from './hooks/useTarefas';
import { organizeWeek, type OrganizeWeek } from './services/organizarSemana';
import { splitTasks } from './utils/agenda';
import './agenda.css';

const PENDING_TITLE_ID = 'agenda-tarefas-pendentes-title';
const DONE_TITLE_ID = 'agenda-tarefas-concluidas-title';

export function TarefasPage({ organize = organizeWeek }: { organize?: OrganizeWeek }) {
  const { tasks, loading, loadError, addTask, setTaskDone, deleteTask } = useTarefas();
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [error, setError] = useState('');
  const focus = useFocusRequest();
  const { pending, done } = splitTasks(tasks);

  async function toggle(task: Task, isDone: boolean) {
    setError('');
    try {
      await setTaskDone(task.id, isDone);
      // A tarefa muda de lista: o foco acompanha a caixa de marcar na nova posição.
      focus(taskCheckboxId(task.id));
    } catch {
      setError('Não foi possível atualizar a tarefa. Tente novamente.');
    }
  }

  async function confirmDelete(task: Task) {
    setPendingDelete(null);
    setError('');
    try {
      await deleteTask(task.id);
      const doneListRemains = task.done && done.length > 1;
      focus(doneListRemains ? DONE_TITLE_ID : PENDING_TITLE_ID);
    } catch {
      setError('Não foi possível excluir a tarefa. Tente novamente.');
    }
  }

  const renderList = (list: Task[]) => (
    <ul className="item-list">
      {list.map((task) => (
        <TarefaItem key={task.id} task={task} onToggle={toggle} onDelete={setPendingDelete} />
      ))}
    </ul>
  );

  return (
    <>
      <FormNovaTarefa onSave={addTask} />
      <section className="card" aria-labelledby={PENDING_TITLE_ID}>
        <h2 id={PENDING_TITLE_ID} tabIndex={-1}>
          Pendentes ({pending.length})
        </h2>
        {loadError ? (
          <div className="empty" role="alert">
            Não foi possível carregar as tarefas.
          </div>
        ) : loading ? null : pending.length ? (
          renderList(pending)
        ) : (
          <div className="empty">Nenhuma tarefa pendente.</div>
        )}
        {pending.length > 0 && <OrganizarSemana organize={organize} />}
        <div className="status" role="alert">
          {error}
        </div>
      </section>
      {done.length > 0 && (
        <section className="card" aria-labelledby={DONE_TITLE_ID}>
          <h2 id={DONE_TITLE_ID} tabIndex={-1}>
            Concluídas
          </h2>
          {renderList(done)}
        </section>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Excluir tarefa?"
          message={`Tem certeza que deseja excluir a tarefa "${pendingDelete.title}"?`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => confirmDelete(pendingDelete)}
        />
      )}
    </>
  );
}
