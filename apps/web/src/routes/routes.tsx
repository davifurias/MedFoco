import { Navigate, type RouteObject } from 'react-router';
import { AgendaLayout } from '../features/agenda/AgendaLayout';
import { EventosPage } from '../features/agenda/EventosPage';
import { HorariosPage } from '../features/agenda/HorariosPage';
import { TarefasPage } from '../features/agenda/TarefasPage';
import { AssessoraPage } from '../features/assessora/AssessoraPage';
import { BuscaPage } from '../features/busca/BuscaPage';
import { CadernoPage } from '../features/caderno/CadernoPage';
import { FocoPage } from '../features/foco/FocoPage';
import { IdeiasAppPage } from '../features/ideias/IdeiasAppPage';
import { IdeiasLayout } from '../features/ideias/IdeiasLayout';
import { InicioPage } from '../features/inicio/InicioPage';
import { MapaPage } from '../features/mapa/MapaPage';
import { MateriasPage } from '../features/materias/MateriasPage';
import { PerfilPage } from '../features/perfil/PerfilPage';
import { QuestoesPage } from '../features/questoes/QuestoesPage';
import { AppLayout } from '../layouts/AppLayout';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <InicioPage /> },
      {
        path: 'agenda',
        element: <AgendaLayout />,
        children: [
          { index: true, element: <EventosPage /> },
          { path: 'tarefas', element: <TarefasPage /> },
          { path: 'horarios', element: <HorariosPage /> },
        ],
      },
      { path: 'materias', element: <MateriasPage /> },
      { path: 'mapa', element: <MapaPage /> },
      { path: 'questoes', element: <QuestoesPage /> },
      { path: 'foco', element: <FocoPage /> },
      { path: 'assessora', element: <AssessoraPage /> },
      {
        path: 'ideias',
        element: <IdeiasLayout />,
        children: [
          { index: true, element: <IdeiasAppPage /> },
          { path: 'caderno', element: <CadernoPage /> },
        ],
      },
      { path: 'busca', element: <BuscaPage /> },
      { path: 'perfil', element: <PerfilPage /> },
      // Endereço desconhecido: volta para o Início.
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
