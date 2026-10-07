import { useMemo, useState } from 'react';
import { ListaDeIdeias } from '../../components/ListaDeIdeias';
import { TextEntryForm } from '../../components/TextEntryForm';
import { useRepository } from '../../data/RepositoryContext';
import { useTextEntries } from '../../shared/useTextEntries';
import {
  AiUnavailableError,
  normalizeGroups,
  organizeNotebook,
  type OrganizeNotebook,
  type ThemeGroup,
} from './services/organizarCaderno';
import './caderno.css';

export function CadernoPage({ organize = organizeNotebook }: { organize?: OrganizeNotebook }) {
  const repository = useRepository();
  const source = useMemo(
    () => ({
      list: () => repository.listNotebookEntries(),
      add: (text: string) => repository.addNotebookEntry({ text }),
      remove: (id: string) => repository.deleteNotebookEntry(id),
    }),
    [repository],
  );
  const { entries, loading, loadError, add, remove } = useTextEntries(source);
  const [groups, setGroups] = useState<ThemeGroup[] | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [organizeStatus, setOrganizeStatus] = useState('');

  async function handleOrganize() {
    setOrganizing(true);
    setOrganizeStatus('Organizando...');
    try {
      const result = normalizeGroups(await organize(entries.map((entry) => entry.text)));
      if (result.length) {
        setGroups(result);
        setOrganizeStatus('');
      } else {
        setOrganizeStatus('Não consegui organizar agora. Tente novamente.');
      }
    } catch (error) {
      setOrganizeStatus(
        error instanceof AiUnavailableError
          ? 'Organizar com IA ainda não está disponível nesta versão do MedFoco.'
          : 'Não consegui organizar agora. Tente novamente.',
      );
    } finally {
      setOrganizing(false);
    }
  }

  return (
    <>
      <section className="card" aria-labelledby="caderno-title">
        <h2 id="caderno-title">Caderno de ideias soltas</h2>
        <p className="note">
          Jogue aqui qualquer ideia aleatória, sem se preocupar com organização — depois peça para a
          IA organizar tudo por tema.
        </p>
        <TextEntryForm
          label="Ideia solta"
          placeholder="Escreva uma ideia solta..."
          submitLabel="Adicionar"
          rows={2}
          onSave={add}
        />
        {entries.length > 0 && (
          <button
            type="button"
            className="btn secondary organizar"
            disabled={organizing}
            onClick={handleOrganize}
          >
            Organizar com IA ✨
          </button>
        )}
        <div className="status" role="status">
          {organizeStatus}
        </div>
      </section>
      {groups && (
        <section className="card" aria-labelledby="organizado-title">
          <h2 id="organizado-title">Organizado por tema</h2>
          {groups.map((group, index) => (
            <div key={index} className="subject-group" role="group" aria-label={group.theme}>
              <h3>{group.theme}</h3>
              <ul className="ideia-list">
                {group.items.map((item, i) => (
                  <li key={i} className="item ideia-texto">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      <ListaDeIdeias
        titleId="ideias-soltas-title"
        title={`Ideias soltas (${entries.length})`}
        entries={entries}
        loading={loading}
        loadError={loadError}
        emptyText="Nada por aqui ainda."
        loadErrorText="Não foi possível carregar o caderno."
        onDelete={remove}
      />
    </>
  );
}
