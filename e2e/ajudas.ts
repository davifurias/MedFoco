import type { Page } from '@playwright/test';

/** Data daqui a `dias` dias, no formato AAAA-MM-DD (dia local). */
export function dataEm(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Telas do app, com o nome na barra de navegação e o título esperado na aba. */
export const TELAS = [
  { rota: '/', nome: 'Início', titulo: 'Início · MedFoco' },
  { rota: '/agenda', nome: 'Agenda', titulo: 'Agenda · Eventos · MedFoco' },
  { rota: '/materias', nome: 'Matérias', titulo: 'Matérias · MedFoco' },
  { rota: '/mapa', nome: 'Mapa', titulo: 'Mapa · MedFoco' },
  { rota: '/questoes', nome: 'Questões', titulo: 'Questões · MedFoco' },
  { rota: '/foco', nome: 'Foco', titulo: 'Foco · MedFoco' },
  { rota: '/assessora', nome: 'Assessora IA', titulo: 'Assessora IA · MedFoco' },
  { rota: '/ideias', nome: 'Ideias', titulo: 'Ideias · Ideias do App · MedFoco' },
] as const;

/** Todas as rotas do app, para varreduras (acessibilidade, rolagem lateral). */
export const TODAS_AS_ROTAS = [
  '/',
  '/agenda',
  '/agenda/tarefas',
  '/agenda/horarios',
  '/materias',
  '/mapa',
  '/questoes',
  '/foco',
  '/assessora',
  '/ideias',
  '/ideias/caderno',
  '/busca?q=co',
  '/perfil',
];

/** Clica na área pela barra de navegação visível (no computador, a de cima; no celular, a de baixo). */
export async function irParaArea(page: Page, nome: string) {
  await page
    .getByRole('navigation', { name: /^Navegação principal/ })
    .getByRole('link', { name: nome, exact: true })
    .click();
}

/** Dados de exemplo gravados antes de abrir a página, para varrer telas com conteúdo. */
export async function semearDados(page: Page) {
  await page.addInitScript(
    (data) => {
      try {
        if (localStorage.getItem('medfoco:v1:events')) return;
        const set = (k: string, v: unknown) =>
          localStorage.setItem(`medfoco:v1:${k}`, JSON.stringify(v));
        set(
          'events',
          ['trabalho', 'ferias', 'provas', 'aulas', 'outro'].map((c, i) => ({
            id: `e${i}`,
            title: `Evento ${c}`,
            date: data.data,
            category: c,
            notes: 'obs',
            createdAt: i + 1,
          })),
        );
        set('tasks', [
          {
            id: 't1',
            title: 'Ler capítulo',
            subject: 'Cardio',
            deadline: data.data,
            priority: 'alta',
            done: false,
            createdAt: 1,
          },
          {
            id: 't2',
            title: 'Resumo pronto',
            subject: '',
            deadline: '',
            priority: 'baixa',
            done: true,
            createdAt: 2,
          },
        ]);
        set(
          'materials',
          [
            'Cardiologia',
            'Neurologia',
            'Pneumologia',
            'Nefrologia',
            'Endocrinologia',
            'Infectologia',
            'Gastro',
            'Hematologia',
          ].map((m, i) => ({
            id: `m${i}`,
            subject: m,
            title: `Aula ${i}`,
            notes: 'anotação',
            tags: ['coração', i % 2 ? 'valvas' : 'sopro'],
            type: i === 0 ? 'video' : 'nota',
            videoLink: i === 0 ? 'https://youtube.com/watch?v=1' : '',
            createdAt: i + 1,
          })),
        );
        set('questions', [
          {
            id: 'q1',
            subject: 'Cardiologia',
            topic: 'IC',
            difficulty: 'fácil',
            question: 'Qual o exame inicial?',
            options: ['Ecocardiograma', 'Radiografia', 'Tomografia', 'Nenhum'],
            correctIndex: 0,
            explanation: 'Avalia a função cardíaca.',
            createdAt: 1,
          },
        ]);
        set('attempts', [
          {
            id: 'a1',
            subject: 'Cardiologia',
            topic: 'IC',
            correct: false,
            date: data.data,
            createdAt: 1,
          },
          {
            id: 'a2',
            subject: 'Neurologia',
            topic: '',
            correct: true,
            date: data.data,
            createdAt: 2,
          },
          { id: 'a3', subject: 'Outra', topic: '', correct: true, date: data.data, createdAt: 3 },
          { id: 'a4', subject: 'Outra', topic: '', correct: false, date: data.data, createdAt: 4 },
        ]);
        set('focusSessions', [
          { id: 's1', type: 'work', minutes: 25, subject: 'Cardio', date: data.data, createdAt: 1 },
          { id: 's2', type: 'break', minutes: 5, subject: null, date: data.data, createdAt: 2 },
        ]);
        set('notebook', [{ id: 'n1', text: 'Ideia solta', createdAt: 1 }]);
        set('appIdeas', [{ id: 'i1', text: 'Ideia do mural', createdAt: 1 }]);
      } catch {
        // sem armazenamento
      }
    },
    { data: dataEm(20) },
  );
}
