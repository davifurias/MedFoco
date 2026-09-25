import { Link } from 'react-router';
import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Saudação e resumo do dia: tarefas pendentes, próximos eventos e minutos estudados',
  'Botão "Estou perdido, o que faço agora?"',
  'Sugestão da IA para hoje',
  'Ações rápidas: tarefa, evento, ideia, material e perguntar',
  'Próximos eventos',
];

export function InicioPage() {
  return (
    <PlaceholderPage title="Início" legacyFeatures={LEGACY_FEATURES}>
      <section className="card">
        <Link to="/perfil" className="btn secondary btn-block">
          ⚙️ Editar perfil acadêmico
        </Link>
      </section>
    </PlaceholderPage>
  );
}
