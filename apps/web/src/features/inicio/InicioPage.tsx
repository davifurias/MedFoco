import { Link } from 'react-router';
import { now, toLocalDateKey } from '../../shared/date';
import { AcoesRapidasCard } from './components/AcoesRapidasCard';
import { ProximosEventosCard } from './components/ProximosEventosCard';
import { ResumoDoDiaCard } from './components/ResumoDoDiaCard';
import { SugestaoDoDiaCard } from './components/SugestaoDoDiaCard';
import { TravouCard } from './components/TravouCard';
import { useInicioData } from './hooks/useInicioData';
import { generateDailySuggestion, type GenerateDailySuggestion } from './services/sugestaoDoDia';
import { countPendingTasks, focusedMinutesToday, upcomingEvents } from './utils/resumo';
import './InicioPage.css';

export function InicioPage({
  generateSuggestion = generateDailySuggestion,
}: {
  generateSuggestion?: GenerateDailySuggestion;
}) {
  const data = useInicioData();
  const current = now();
  const today = toLocalDateKey(current);
  const upcoming = upcomingEvents(data.events, today);

  return (
    <>
      <ResumoDoDiaCard
        now={current}
        pendingTasks={countPendingTasks(data.tasks)}
        upcomingEvents={upcoming.length}
        focusedMinutes={focusedMinutesToday(data.sessions, today)}
      />
      <TravouCard />
      <SugestaoDoDiaCard suggestion={data.suggestion} today={today} generate={generateSuggestion} />
      <AcoesRapidasCard
        onAddTask={data.addTask}
        onAddEvent={data.addEvent}
        onAddIdea={data.addIdea}
      />
      <ProximosEventosCard events={upcoming} onDelete={data.deleteEvent} />
      <section className="card">
        <Link to="/perfil" className="btn secondary btn-block">
          ⚙️ Editar perfil acadêmico
        </Link>
      </section>
    </>
  );
}
