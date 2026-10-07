import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { RepositoryProvider } from '../../data/RepositoryContext';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import type { Material } from '../../data/types';
import { routes } from '../../routes/routes';
import { AssessoraPage } from './AssessoraPage';
import { type LessonStep } from './services/assessora';

const mat = (id: string, extra: Partial<Material> = {}): Material => ({
  id,
  subject: 'Cardio',
  title: `Aula ${id}`,
  notes: `Anotação ${id}`,
  tags: [],
  type: 'nota',
  videoLink: '',
  createdAt: 1,
  ...extra,
});

function storageWith(materials: Material[] = []): KeyValueStorage {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEYS.materials, JSON.stringify(materials));
  return storage;
}

type Props = Parameters<typeof AssessoraPage>[0];
function renderPage(props: Props = {}, materials: Material[] = []) {
  render(
    <MemoryRouter>
      <RepositoryProvider repository={createLocalRepository(storageWith(materials))}>
        <AssessoraPage {...props} />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

const steps: LessonStep[] = [
  {
    title: 'Passo um',
    explanation: 'Explicação 1',
    analogy: 'Como uma bomba',
    check: 'Pergunta 1?',
    checkAnswer: 'Resposta 1',
  },
  { title: 'Passo dois', explanation: 'Explicação 2', analogy: '', check: '', checkAnswer: '' },
];

const field = (name: string | RegExp) => screen.getByLabelText(name);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const status = () =>
  screen
    .getAllByRole('status')
    .map((s) => s.textContent)
    .join('|');
const chooseFile = (file: File) =>
  fireEvent.change(field(/Enviar do computador/), { target: { files: [file] } });

afterEach(cleanup);

describe('Assessora — sem IA (versão atual)', () => {
  it('abre pelo app, com o aviso fixo de que a IA ainda não está disponível', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/assessora'] });
    render(<App router={router} repository={createLocalRepository(createMemoryStorage())} />);
    expect(screen.getByRole('note').textContent).toContain('ainda não está disponível');
    expect(screen.getByRole('heading', { name: 'Aula guiada' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Assessora de estudos' })).toBeTruthy();
    expect(
      screen.getByText('Pergunte algo, anexe um material acima, ou peça um plano de estudos.'),
    ).toBeTruthy();
  });

  it('gerar aula avisa que não está disponível, sem simular aula', async () => {
    renderPage();
    fireEvent.change(field('Assunto da aula'), { target: { value: 'Ciclo cardíaco' } });
    click('Gerar aula guiada');
    expect(
      await screen.findByText('A aula guiada ainda não está disponível nesta versão do MedFoco.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Passo 1 de/)).toBeNull();
  });

  it('enviar mensagem avisa, mantém o texto digitado e não cria conversa', async () => {
    renderPage();
    fireEvent.change(field('Mensagem para a assessora'), { target: { value: 'Oi' } });
    click('Enviar');
    expect(
      await screen.findByText(
        /A assessora ainda não está disponível nesta versão do MedFoco. Sua mensagem não foi enviada./,
      ),
    ).toBeTruthy();
    expect((field('Mensagem para a assessora') as HTMLTextAreaElement).value).toBe('Oi');
    const log = screen.getByRole('log', { name: 'Conversa' });
    expect(within(log).queryByText('Oi')).toBeNull();
    expect(within(log).queryAllByText(/./).length).toBe(1); // só o texto de conversa vazia
  });

  it.each([
    '😵 Estou perdido, o que faço agora?',
    'Planejar semana',
    'Me explique algo',
    'Priorizar provas',
  ])('o atalho "%s" também avisa que não está disponível', async (label) => {
    renderPage();
    click(label);
    expect(await screen.findByText(/ainda não está disponível nesta versão/)).toBeTruthy();
  });

  it('"Criar questões" avisa que não está disponível quando a aula existe mas o serviço não', async () => {
    renderPage({ generate: async () => steps });
    fireEvent.change(field('Assunto da aula'), { target: { value: 'X' } });
    click('Gerar aula guiada');
    await screen.findByText('Passo 1 de 2 · X');
    click('Próximo');
    click(/Criar questões desta aula/);
    expect(
      await screen.findByText(
        'Criar questões com IA ainda não está disponível nesta versão do MedFoco.',
      ),
    ).toBeTruthy();
  });
});

describe('Assessora — aula guiada (interface pronta para a IA)', () => {
  const generate = vi.fn(async () => steps);
  const start = async (topic = '  Ciclo cardíaco ') => {
    fireEvent.change(field('Assunto da aula'), { target: { value: topic } });
    click('Gerar aula guiada');
    await screen.findByText(/Passo 1 de/);
  };

  it('sem assunto: avisa, marca o campo e leva o foco até ele', () => {
    renderPage({ generate });
    click('Gerar aula guiada');
    expect(screen.getByText('Digite o assunto da aula.')).toBeTruthy();
    expect(document.activeElement).toBe(field('Assunto da aula'));
    expect(field('Assunto da aula').getAttribute('aria-invalid')).toBe('true');
    expect(generate).not.toHaveBeenCalled();
  });

  it('mostra os passos, navega e esconde a resposta até pedir', async () => {
    renderPage({ generate });
    await start();
    expect(generate).toHaveBeenCalledWith('Ciclo cardíaco');
    expect(screen.getByText('Passo 1 de 2 · Ciclo cardíaco')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Passo um' })).toBeTruthy();
    expect(screen.getByText('💡 Analogia: Como uma bomba')).toBeTruthy();
    expect(screen.getByText('Pergunta 1?')).toBeTruthy();
    const details = screen.getByText('Ver resposta').closest('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull();

    click('Próximo');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Passo dois'));
    expect(screen.getByText('Passo 2 de 2 · Ciclo cardíaco')).toBeTruthy();
    expect(screen.queryByText('Ver resposta')).toBeNull(); // passo sem pergunta
    expect(screen.queryByRole('button', { name: 'Próximo' })).toBeNull();
    click('Anterior');
    expect(screen.getByText('Passo 1 de 2 · Ciclo cardíaco')).toBeTruthy();
    expect((screen.getByText('Ver resposta').closest('details') as HTMLDetailsElement).open).toBe(
      false,
    );
  });

  it('a resposta de um passo não fica aberta no passo seguinte', async () => {
    const both = steps.map((step) => ({ ...step, check: 'P?', checkAnswer: 'R' }));
    renderPage({ generate: async () => both });
    await start();
    const details = screen.getByText('Ver resposta').closest('details') as HTMLDetailsElement;
    details.open = true;
    click('Próximo');
    expect((screen.getByText('Ver resposta').closest('details') as HTMLDetailsElement).open).toBe(
      false,
    );
  });

  it('cria as questões da aula quando o serviço consegue', async () => {
    const createQuestions = vi.fn(async () => {});
    renderPage({ generate, createQuestions });
    await start();
    click('Próximo');
    click(/Criar questões desta aula/);
    expect(await screen.findByText('Questões adicionadas ao Banco de Questões ✅')).toBeTruthy();
    expect(createQuestions).toHaveBeenCalledWith('Ciclo cardíaco', steps);
  });

  it('avisa quando a criação das questões falha por outro motivo', async () => {
    renderPage({ generate, createQuestions: async () => Promise.reject(new Error('x')) });
    await start();
    click('Próximo');
    click(/Criar questões desta aula/);
    expect(
      await screen.findByText('Não consegui criar as questões agora. Tente novamente.'),
    ).toBeTruthy();
  });

  it('trata erro, resposta vazia e dados malformados sem quebrar', async () => {
    renderPage({ generate: async () => Promise.reject(new Error('x')) });
    fireEvent.change(field('Assunto da aula'), { target: { value: 'A' } });
    click('Gerar aula guiada');
    expect(
      await screen.findByText('Não consegui gerar a aula agora. Tente novamente.'),
    ).toBeTruthy();
    cleanup();

    renderPage({ generate: async () => [{ lixo: true }] as unknown as LessonStep[] });
    fireEvent.change(field('Assunto da aula'), { target: { value: 'A' } });
    click('Gerar aula guiada');
    expect(await screen.findByText(/Não consegui montar a aula agora/)).toBeTruthy();
  });

  it('desativa o botão enquanto gera e mostra o andamento', async () => {
    let finish: (value: LessonStep[]) => void = () => {};
    renderPage({ generate: () => new Promise<LessonStep[]>((resolve) => (finish = resolve)) });
    fireEvent.change(field('Assunto da aula'), { target: { value: 'A' } });
    click('Gerar aula guiada');
    expect(status()).toContain('Gerando aula...');
    expect(
      (screen.getByRole('button', { name: 'Gerar aula guiada' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await act(async () => finish(steps));
    expect(screen.getByText(/Passo 1 de 2/)).toBeTruthy();
  });
});

describe('Assessora — chat (interface pronta para a IA)', () => {
  const send = vi.fn(async ({ text }: { text: string }) => `Resposta a: ${text}`);

  it('mostra a conversa, limpa a caixa e anuncia pelo log', async () => {
    renderPage({ send });
    fireEvent.change(field('Mensagem para a assessora'), { target: { value: ' Olá ' } });
    click('Enviar');
    const log = screen.getByRole('log', { name: 'Conversa' });
    expect(await within(log).findByText('Resposta a: Olá')).toBeTruthy();
    expect(log.textContent).toContain('Você: Olá');
    expect(log.textContent).toContain('Assessora: Resposta a: Olá');
    expect((field('Mensagem para a assessora') as HTMLTextAreaElement).value).toBe('');
  });

  it('Enter envia e Shift+Enter não', async () => {
    send.mockClear();
    renderPage({ send });
    const input = field('Mensagem para a assessora');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(send).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });

  it('mensagem vazia não é enviada: avisa e leva o foco à caixa', () => {
    send.mockClear();
    renderPage({ send });
    fireEvent.change(field('Mensagem para a assessora'), { target: { value: '   ' } });
    click('Enviar');
    expect(status()).toContain('Escreva uma mensagem.');
    expect(document.activeElement).toBe(field('Mensagem para a assessora'));
    expect(send).not.toHaveBeenCalled();
  });

  it('o atalho envia a pergunta pronta e preserva o que estava sendo digitado', async () => {
    send.mockClear();
    renderPage({ send });
    fireEvent.change(field('Mensagem para a assessora'), { target: { value: 'rascunho' } });
    click('Priorizar provas');
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0]?.[0].text).toContain('provas mais próximas');
    expect((field('Mensagem para a assessora') as HTMLTextAreaElement).value).toBe('rascunho');
  });

  it('mantém só as últimas 30 mensagens', async () => {
    renderPage({ send });
    for (let i = 0; i < 17; i++) {
      fireEvent.change(field('Mensagem para a assessora'), { target: { value: `m${i}` } });
      click('Enviar');
      await screen.findByText(`Resposta a: m${i}`);
    }
    const log = screen.getByRole('log', { name: 'Conversa' });
    expect(log.querySelectorAll('.bubble')).toHaveLength(30);
    expect(within(log).queryByText('m0')).toBeNull();
    expect(within(log).getByText('Resposta a: m16')).toBeTruthy();
  });
});

describe('Assessora — anexos', () => {
  const send = vi.fn(async () => 'ok');

  it('lista só os materiais com anotação e anexa o escolhido, com a pergunta pronta', async () => {
    renderPage({ send }, [
      mat('1'),
      mat('2', { notes: '   ' }),
      mat('3', { subject: 'Neuro', notes: 'N' }),
    ]);
    await screen.findByRole('option', { name: 'Cardio — Aula 1' });
    const options = [...(field('Explicar um material salvo') as HTMLSelectElement).options].map(
      (o) => o.text,
    );
    expect(options).toEqual([
      '📚 Explicar um material salvo...',
      'Cardio — Aula 1',
      'Neuro — Aula 3',
    ]);
    fireEvent.change(field('Explicar um material salvo'), { target: { value: '1' } });
    expect(screen.getByText('Aula 1', { selector: '.anexo' })).toBeTruthy();
    expect((field('Mensagem para a assessora') as HTMLTextAreaElement).value).toBe(
      'Explique o material "Aula 1" de forma simples.',
    );
    expect(document.body.textContent).not.toMatch(/tdah/i);
  });

  it('envia o anexo junto e o remove depois de enviar', async () => {
    send.mockClear();
    renderPage({ send }, [mat('1')]);
    await screen.findByRole('option', { name: 'Cardio — Aula 1' });
    fireEvent.change(field('Explicar um material salvo'), { target: { value: '1' } });
    click('Enviar');
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledWith({
      text: 'Explique o material "Aula 1" de forma simples.',
      attachment: { kind: 'text', title: 'Aula 1', content: 'Anotação 1' },
    });
    await waitFor(() => expect(document.querySelector('.anexo')).toBeNull());
    expect((field('Explicar um material salvo') as HTMLSelectElement).value).toBe('');
  });

  it('remover o anexo limpa o selo e o seletor', async () => {
    renderPage({ send }, [mat('1')]);
    await screen.findByRole('option', { name: 'Cardio — Aula 1' });
    fireEvent.change(field('Explicar um material salvo'), { target: { value: '1' } });
    click('Remover anexo');
    expect(document.querySelector('.anexo')).toBeNull();
    expect((field('Explicar um material salvo') as HTMLSelectElement).value).toBe('');
  });

  it('lê arquivo de texto neste aparelho e anexa', async () => {
    renderPage({ send });
    chooseFile(new File(['conteúdo do resumo'], 'resumo.md', { type: 'text/markdown' }));
    await waitFor(() =>
      expect(document.querySelector('.anexo')?.textContent).toContain('resumo.md'),
    );
    expect((field('Mensagem para a assessora') as HTMLTextAreaElement).value).toBe(
      'Explique o material "resumo.md" de forma simples.',
    );
    click('Enviar');
    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send.mock.calls.at(-1)).toMatchObject([
      { attachment: { kind: 'text', title: 'resumo.md', content: 'conteúdo do resumo' } },
    ]);
  });

  it('aceita imagem como anexo', async () => {
    renderPage({ send });
    chooseFile(new File(['x'], 'print.png', { type: 'image/png' }));
    await waitFor(() =>
      expect(document.querySelector('.anexo')?.textContent).toContain('print.png'),
    );
    expect((field('Mensagem para a assessora') as HTMLTextAreaElement).value).toContain('imagem');
  });

  it('PDF e outros tipos: avisa o que fazer, sem anexar', async () => {
    renderPage({ send });
    chooseFile(new File(['x'], 'livro.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText(/não pode ter o texto lido automaticamente aqui/)).toBeTruthy();
    expect(document.querySelector('.anexo')).toBeNull();
  });

  it('arquivos grandes demais são recusados com aviso', async () => {
    renderPage({ send });
    chooseFile(new File(['x'.repeat(1024 * 1024 + 1)], 'grande.txt', { type: 'text/plain' }));
    expect(await screen.findByText(/grande demais \(máximo 1 MB\)/)).toBeTruthy();
    expect(document.querySelector('.anexo')).toBeNull();
    const image = new File(['x'], 'enorme.png', { type: 'image/png' });
    Object.defineProperty(image, 'size', { value: 5 * 1024 * 1024 + 1 });
    chooseFile(image);
    expect(await screen.findByText(/A imagem é grande demais \(máximo 5 MB\)/)).toBeTruthy();
    expect(document.querySelector('.anexo')).toBeNull();
  });
});
