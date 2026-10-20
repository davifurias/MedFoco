import { Link } from 'react-router';
import { MORE_AREAS } from '../../app/navigation';
import { Icon } from '../../components/Icon';
import './mais.css';

/** Página "Mais" (celular): as áreas que não cabem na barra de baixo, mais o Perfil. */
export function MaisPage() {
  return (
    <section className="card" aria-labelledby="mais-title">
      <h2 id="mais-title">Mais áreas</h2>
      <ul className="mais-lista">
        {MORE_AREAS.map((area) => (
          <li key={area.path}>
            <Link to={area.path} className="mais-item">
              <span className="mais-icone">
                <Icon name={area.icon} />
              </span>
              <span className="mais-nome">{area.label}</span>
              <Icon name="seta" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
