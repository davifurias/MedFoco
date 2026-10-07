import { formatShortDate, now, toLocalDateKey } from '../../shared/date';
import { useFocusRequest } from '../../shared/useFocusRequest';
import { FormTecnica } from './components/FormTecnica';
import { TimerAtivo } from './components/TimerAtivo';
import { useFoco } from './FocoContext';
import { focusMinutesOn, recentSessions } from './utils/sessoes';
import './foco.css';

export function FocoPage() {
  const { timer, seconds, sessions, notice, recordError, configure, resume, pause, stop } =
    useFoco();
  const focus = useFocusRequest();
  const status = (
    <div className="status" role="status">
      {notice}
      {recordError && <div role="alert">Não foi possível registrar a sessão no histórico.</div>}
    </div>
  );

  if (timer) {
    return (
      <>
        <TimerAtivo
          timer={timer}
          seconds={seconds}
          onResume={resume}
          onPause={pause}
          onStop={() => {
            stop();
            focus('tecnica-title');
          }}
        />
        {status}
      </>
    );
  }

  const today = focusMinutesOn(sessions, toLocalDateKey(now()));
  const recent = recentSessions(sessions);
  return (
    <>
      <FormTecnica onConfigure={configure} />
      {status}
      <section className="card" aria-labelledby="hoje-title">
        <h2 id="hoje-title">Hoje</h2>
        <p className="hoje-minutos">{today} min de foco</p>
      </section>
      <section className="card" aria-labelledby="historico-title">
        <h2 id="historico-title">Histórico recente</h2>
        {recent.length ? (
          <ul className="historico-list">
            {recent.map((session) => (
              <li key={session.id} className="item">
                <div className="historico-info">
                  <span aria-hidden="true">{session.type === 'work' ? '🍅' : '☕'}</span>
                  <span className="sr-only">{session.type === 'work' ? 'Foco' : 'Pausa'}</span>{' '}
                  {session.minutes} min{session.subject ? ` · ${session.subject}` : ''}
                </div>
                <div className="meta">{formatShortDate(session.date)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">Nenhuma sessão registrada ainda.</div>
        )}
      </section>
    </>
  );
}
