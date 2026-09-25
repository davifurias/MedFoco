import { formatLongDate } from '../../../shared/date';
import { greeting } from '../utils/resumo';

interface ResumoDoDiaCardProps {
  now: Date;
  pendingTasks: number;
  upcomingEvents: number;
  focusedMinutes: number;
}

export function ResumoDoDiaCard({
  now,
  pendingTasks,
  upcomingEvents,
  focusedMinutes,
}: ResumoDoDiaCardProps) {
  const counters = [
    { value: pendingTasks, label: 'tarefas pendentes' },
    { value: upcomingEvents, label: 'próximos eventos' },
    { value: focusedMinutes, label: 'min estudados hoje' },
  ];
  return (
    <section className="card" aria-label="Resumo do dia">
      <div className="resumo-date">{formatLongDate(now)}</div>
      <p className="resumo-greeting">
        {greeting(now.getHours())} <span aria-hidden="true">👋</span>
      </p>
      <div className="row resumo-counters">
        {counters.map((counter) => (
          <div key={counter.label}>
            <div className="counter-value">{counter.value}</div>
            <div>{counter.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
