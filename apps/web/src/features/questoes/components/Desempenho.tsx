import type { Attempt } from '../../../data/types';
import { PERFORMANCE_LIMIT, computePerformance, performanceLevel } from '../utils/questoes';

/** Os assuntos com menor percentual de acerto; some enquanto não houver respostas. */
export function Desempenho({ attempts }: { attempts: readonly Attempt[] }) {
  const weakest = computePerformance(attempts).slice(0, PERFORMANCE_LIMIT);
  if (!weakest.length) return null;
  return (
    <section className="card" aria-labelledby="desempenho-title">
      <h2 id="desempenho-title">Seu desempenho</h2>
      <ul className="desempenho-list">
        {weakest.map((item) => (
          <li key={`${item.subject}|${item.topic}`} className="item">
            <div>
              {item.subject}
              {item.topic ? ` — ${item.topic}` : ''}
              <div className="meta">
                {item.correct}/{item.total} questões
              </div>
            </div>
            <div className={`pct pct-${performanceLevel(item.pct)}`}>{item.pct}%</div>
          </li>
        ))}
      </ul>
      <p className="note">A Assessora usa isso para priorizar o que sugerir.</p>
    </section>
  );
}
