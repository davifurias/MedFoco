import { Link } from 'react-router';

/** Cartão de destaque "Travou?". Por enquanto só leva à Assessora IA (IA real na Fase 3). */
export function TravouCard() {
  return (
    <section className="card travou-card" aria-labelledby="travou-title">
      <h2 id="travou-title">Travou?</h2>
      <p>Sem saber por onde começar agora? Deixa que eu escolho uma coisa só pra você.</p>
      <Link to="/assessora" className="btn travou-button btn-block">
        <span aria-hidden="true">😵</span> Estou perdido, o que faço agora?
      </Link>
    </section>
  );
}
