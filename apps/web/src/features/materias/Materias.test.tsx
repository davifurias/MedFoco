import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../app/App';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import type { MedFocoRepository } from '../../data/repository';
import type { Material } from '../../data/types';
import { routes } from '../../routes/routes';

function renderApp(storage: KeyValueStorage = createMemoryStorage(), repo?: MedFocoRepository) {
  const router = createMemoryRouter(routes, { initialEntries: ['/materias'] });
  render(<App router={router} repository={repo ?? createLocalRepository(storage)} />);
  return { storage, repository: createLocalRepository(storage) };
}

const store = (storage: KeyValueStorage, value: unknown) =>
  storage.setItem(STORAGE_KEYS.materials, JSON.stringify(value));

function failingOnMaterials(base: KeyValueStorage = createMemoryStorage()): KeyValueStorage {
  return {
    getItem: (k) => base.getItem(k),
    setItem: (k, v) => {
      if (k === STORAGE_KEYS.materials) throw new Error('falha ao gravar');
      base.setItem(k, v);
    },
  };
}

const mat = (id: string, extra: Partial<Material> = {}): Material => ({
  id,
  subject: 'Cardiologia',
  title: `Material ${id}`,
  notes: '',
  tags: [],
  type: 'nota',
  videoLink: '',
  createdAt: Number(id.replace(/\D/g, '')) || 1,
  ...extra,
});

const list = () => screen.getByRole('region', { name: 'Seus materiais' });
const field = (name: string) => screen.getByLabelText(name);
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar material' }));

afterEach(cleanup);

describe('Matérias › formulário', () => {
  it('começa em Nota, sem campo de link nem de arquivo, e mostra estado vazio', async () => {
    renderApp();
    expect(screen.getByRole('button', { name: '📝 Nota' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.queryByLabelText('Link do vídeo')).toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
    expect(await within(list()).findByText('Nenhum material ainda.')).toBeTruthy();
  });

  it('exige título, leva o foco ao campo e o marca como inválido', async () => {
    const { repository } = renderApp();
    save();
    expect(await screen.findByText('Dê um título ao material.')).toBeTruthy();
    expect(document.activeElement).toBe(field('Título do material'));
    expect(field('Título do material').getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(field('Título do material'), { target: { value: 'Aula' } });
    expect(field('Título do material').getAttribute('aria-invalid')).toBeNull();
    expect(await repository.listMaterials()).toEqual([]);
  });

  it('cria nota: matéria vazia vira "Geral", tags em minúsculas, foco volta ao título', async () => {
    const { repository, storage } = renderApp();
    fireEvent.change(field('Título do material'), { target: { value: ' Resumo de ECG ' } });
    fireEvent.change(field('Anotações'), { target: { value: 'ondas P, QRS e T' } });
    fireEvent.change(field('Assuntos-chave'), { target: { value: 'Coração, ECG,, coração' } });
    save();

    await within(list()).findByText('Geral');
    expect(within(list()).getByText('📝 Resumo de ECG')).toBeTruthy();
    expect(within(list()).getByText('ondas P, QRS e T')).toBeTruthy();
    expect(
      within(within(list()).getByRole('list', { name: 'Assuntos-chave' }))
        .getAllByRole('listitem')
        .map((l) => l.textContent),
    ).toEqual(['coração', 'ecg']);
    expect(await screen.findByText('Material salvo!')).toBeTruthy();
    expect(document.activeElement).toBe(field('Título do material'));
    expect((field('Título do material') as HTMLInputElement).value).toBe('');
    // O que é realmente gravado já traz "Geral" (não depende só da leitura).
    const saved = JSON.parse(storage.getItem(STORAGE_KEYS.materials) ?? '[]') as Material[];
    expect(saved.map((m) => m.subject)).toEqual(['Geral']);
    expect(await repository.listMaterials()).toEqual([
      expect.objectContaining({
        subject: 'Geral',
        title: 'Resumo de ECG',
        type: 'nota',
        videoLink: '',
        tags: ['coração', 'ecg'],
      }),
    ]);
  });

  it('cria aula em vídeo com link normalizado e abre em nova aba com segurança', async () => {
    const { repository } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: '🎥 Aula em vídeo' }));
    expect(screen.getByText(/O app não consegue assistir ao vídeo sozinho/)).toBeTruthy();
    fireEvent.change(field('Matéria'), { target: { value: 'Fisiologia' } });
    fireEvent.change(field('Título do material'), { target: { value: 'Aula 1' } });
    fireEvent.change(field('Link do vídeo'), { target: { value: 'youtube.com/watch?v=abc' } });
    save();
    const link = await within(list()).findByRole('link', { name: /Aula 1/ });
    expect(link.getAttribute('href')).toBe('https://youtube.com/watch?v=abc');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.textContent).toContain('abre em uma nova aba');
    expect((await repository.listMaterials())[0]).toMatchObject({
      type: 'video',
      subject: 'Fisiologia',
    });
  });

  it('recusa link javascript: no formulário e leva o foco ao campo', async () => {
    const { repository } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: '🎥 Aula em vídeo' }));
    fireEvent.change(field('Título do material'), { target: { value: 'Aula' } });
    fireEvent.change(field('Link do vídeo'), { target: { value: 'javascript:alert(1)' } });
    save();
    expect(
      await screen.findByText('Informe um link válido, começando com http:// ou https://.'),
    ).toBeTruthy();
    expect(document.activeElement).toBe(field('Link do vídeo'));
    expect(field('Link do vídeo').getAttribute('aria-invalid')).toBe('true');
    expect(await repository.listMaterials()).toEqual([]);
  });

  it('recusa link com usuário e senha, explicando o motivo', async () => {
    const { repository } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: '🎥 Aula em vídeo' }));
    fireEvent.change(field('Título do material'), { target: { value: 'Aula' } });
    fireEvent.change(field('Link do vídeo'), {
      target: { value: 'https://usuario:senha@site.com/v' },
    });
    save();
    expect(await screen.findByText('Links com usuário e senha não são aceitos.')).toBeTruthy();
    expect(document.activeElement).toBe(field('Link do vídeo'));
    expect(await repository.listMaterials()).toEqual([]);
  });

  it('aceita link com porta e sem https://', async () => {
    const { repository } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: '🎥 Aula em vídeo' }));
    fireEvent.change(field('Título do material'), { target: { value: 'Aula' } });
    fireEvent.change(field('Link do vídeo'), { target: { value: 'meusite.com:8080/video' } });
    save();
    await screen.findByText('Material salvo!');
    expect((await repository.listMaterials())[0]?.videoLink).toBe('https://meusite.com:8080/video');
  });

  it('vídeo sem link é aceito; o link digitado é descartado ao trocar para Nota', async () => {
    const { repository } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: '🎥 Aula em vídeo' }));
    fireEvent.change(field('Título do material'), { target: { value: 'Sem link' } });
    save();
    await screen.findByText('Material salvo!');
    expect((await repository.listMaterials())[0]).toMatchObject({ type: 'video', videoLink: '' });

    fireEvent.change(field('Título do material'), { target: { value: 'Virou nota' } });
    fireEvent.change(field('Link do vídeo'), { target: { value: 'https://exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: '📝 Nota' }));
    save();
    await waitFor(async () => expect(await repository.listMaterials()).toHaveLength(2));
    expect(
      (await repository.listMaterials()).find((m) => m.title === 'Virou nota')?.videoLink,
    ).toBe('');
  });

  it('mostra erro se não conseguir salvar', async () => {
    renderApp(failingOnMaterials());
    fireEvent.change(field('Título do material'), { target: { value: 'Aula' } });
    save();
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
  });
});

describe('Matérias › lista', () => {
  it('agrupa por matéria em ordem alfabética, mais recente primeiro dentro do grupo', async () => {
    const storage = createMemoryStorage();
    store(storage, [
      mat('1', { subject: 'Fisiologia' }),
      mat('2', { subject: 'Anatomia' }),
      mat('3', { subject: 'Fisiologia' }),
    ]);
    renderApp(storage);
    await within(list()).findAllByRole('group');
    const groups = within(list()).getAllByRole('group');
    expect(groups.map((g) => within(g).getByRole('heading').textContent)).toEqual([
      'Anatomia',
      'Fisiologia',
    ]);
    expect(
      within(groups[1]!)
        .getAllByRole('listitem')
        .map((l) => l.textContent),
    ).toEqual([expect.stringContaining('Material 3'), expect.stringContaining('Material 1')]);
  });

  it('mostra só os primeiros 200 caracteres das anotações', async () => {
    const storage = createMemoryStorage();
    store(storage, [mat('1', { notes: 'x'.repeat(250) })]);
    renderApp(storage);
    expect((await within(list()).findByText(/^x+…$/)).textContent).toHaveLength(201);
  });

  it('mantém os dados depois de recarregar', async () => {
    const storage = createMemoryStorage();
    renderApp(storage);
    fireEvent.change(field('Título do material'), { target: { value: 'Persistente' } });
    save();
    await within(list()).findByText('📝 Persistente');
    cleanup();
    renderApp(storage);
    expect(await within(list()).findByText('📝 Persistente')).toBeTruthy();
  });

  it('um item danificado salvo não derruba a tela nem esconde os válidos', async () => {
    const storage = createMemoryStorage();
    store(storage, [{ id: 'x' }, null, 42, mat('1')]);
    renderApp(storage);
    expect(await within(list()).findByText('📝 Material 1')).toBeTruthy();
    expect(within(list()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('uma carga inicial atrasada não apaga um material recém-criado', async () => {
    const base = createLocalRepository(createMemoryStorage());
    let release: () => void = () => {};
    let first = true;
    const slow: MedFocoRepository = {
      ...base,
      listMaterials: async () => {
        if (!first) return base.listMaterials();
        first = false;
        const stale = await base.listMaterials();
        await new Promise<void>((resolve) => (release = resolve));
        return stale;
      },
    };
    renderApp(createMemoryStorage(), slow);
    fireEvent.change(field('Título do material'), { target: { value: 'Novo' } });
    save();
    await within(list()).findByText('📝 Novo');
    await act(async () => release());
    expect(within(list()).getByText('📝 Novo')).toBeTruthy();
  });
});

describe('Matérias › exclusão', () => {
  const setup = () => {
    const storage = createMemoryStorage();
    store(storage, [mat('1'), mat('2')]);
    return renderApp(storage);
  };

  it('pede confirmação; Cancelar e Esc não excluem', async () => {
    const { repository } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir material Material 1' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Excluir material?' });
    expect(dialog.textContent).toContain('Tem certeza que deseja excluir o material "Material 1"?');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir material Material 1' }));
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(await repository.listMaterials()).toHaveLength(2);
  });

  it('confirmar exclui e leva o foco ao título da lista', async () => {
    const { repository } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir material Material 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(within(list()).queryByText('📝 Material 1')).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(list()).getByRole('heading', { name: 'Seus materiais' }),
      ),
    );
    expect((await repository.listMaterials()).map((m) => m.id)).toEqual(['2']);
  });

  it('mostra erro acessível se a exclusão falhar e mantém o material', async () => {
    const base = createMemoryStorage();
    store(base, [mat('1')]);
    renderApp(failingOnMaterials(base));
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir material Material 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(
      await screen.findByText('Não foi possível excluir o material. Tente novamente.'),
    ).toBeTruthy();
    expect(within(list()).getByText('📝 Material 1')).toBeTruthy();
  });
});

describe('Matérias › resumo com IA', () => {
  it('só aparece em aula em vídeo com anotações e avisa que não está disponível', async () => {
    const storage = createMemoryStorage();
    store(storage, [
      mat('1', { type: 'video', notes: 'transcrição' }),
      mat('2', { type: 'video', notes: '' }),
      mat('3', { type: 'nota', notes: 'texto' }),
    ]);
    renderApp(storage);
    await within(list()).findAllByRole('listitem');
    const buttons = screen.getAllByRole('button', { name: 'Gerar resumo e questões com IA ✨' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]!);
    expect(await screen.findByText(/O resumo com IA ainda não está disponível/)).toBeTruthy();
    expect(storage.getItem(STORAGE_KEYS.materials)).toBe(
      JSON.stringify([
        mat('1', { type: 'video', notes: 'transcrição' }),
        mat('2', { type: 'video', notes: '' }),
        mat('3', { type: 'nota', notes: 'texto' }),
      ]),
    );
  });
});

describe('Matérias › segurança', () => {
  const PAYLOADS = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '"><svg onload=alert(1)>',
  ];

  it('título, matéria, anotações e assuntos-chave são exibidos como texto', async () => {
    const storage = createMemoryStorage();
    store(
      storage,
      PAYLOADS.map((p, i) => mat(String(i + 1), { title: p, subject: p, notes: p, tags: [p] })),
    );
    renderApp(storage);
    await within(list()).findAllByRole('listitem');
    for (const payload of PAYLOADS) expect(list().textContent).toContain(payload);
    expect(list().querySelector('img, script, svg, a')).toBeNull();
  });

  it('um link javascript: adulterado nos dados salvos nunca vira link clicável', async () => {
    const storage = createMemoryStorage();
    store(storage, [mat('1', { type: 'video', videoLink: 'javascript:alert(1)', title: 'Mau' })]);
    renderApp(storage);
    await within(list()).findByText('🎥 Mau');
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    expect(within(list()).queryByRole('link')).toBeNull();
  });
});
