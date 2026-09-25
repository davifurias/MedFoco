import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Aula guiada (modo TDAH): um assunto explicado em passos curtos, com analogias e checagem',
  'Chat com a assessora de estudos',
  'Atalhos: Estou perdido, Planejar semana, Me explique algo, Priorizar provas',
  'Explicar um material salvo ou um arquivo enviado do computador',
];

export function AssessoraPage() {
  return <PlaceholderPage title="Assessora IA" legacyFeatures={LEGACY_FEATURES} />;
}
