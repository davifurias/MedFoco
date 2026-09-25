import { Link } from 'react-router';
import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Curso e período',
  'Matérias que está cursando',
  'Metas e preferências de estudo, usadas pela Assessora IA',
];

export function PerfilPage() {
  return (
    <PlaceholderPage title="Perfil acadêmico" legacyFeatures={LEGACY_FEATURES}>
      <Link to="/" className="btn secondary btn-block">
        ← Voltar ao início
      </Link>
    </PlaceholderPage>
  );
}
