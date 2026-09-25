import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './app/App';
import { routes } from './routes/routes';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento #root não encontrado em index.html');

const router = createBrowserRouter(routes);

createRoot(rootElement).render(
  <StrictMode>
    <App router={router} />
  </StrictMode>,
);
