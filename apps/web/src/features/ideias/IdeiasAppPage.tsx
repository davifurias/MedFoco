import { useMemo } from 'react';
import { ListaDeIdeias } from '../../components/ListaDeIdeias';
import { TextEntryForm } from '../../components/TextEntryForm';
import { useRepository } from '../../data/RepositoryContext';
import { formatShortDate, toLocalDateKey } from '../../shared/date';
import { useTextEntries } from '../../shared/useTextEntries';
import './ideias.css';

export function IdeiasAppPage() {
  const repository = useRepository();
  const source = useMemo(
    () => ({
      list: () => repository.listAppIdeas(),
      add: (text: string) => repository.addAppIdea({ text }),
      remove: (id: string) => repository.deleteAppIdea(id),
    }),
    [repository],
  );
  const { entries, loading, loadError, add, remove } = useTextEntries(source);

  return (
    <>
      <section className="card" aria-labelledby="ideias-app-title">
        <h2 id="ideias-app-title">Espaço de ideias para o MedFoco</h2>
        <p className="note">
          Aqui ficam as suas sugestões de melhoria para o MedFoco. No aplicativo original este
          espaço era <strong>compartilhado</strong> com todo mundo que usava o mesmo link; por
          enquanto ele fica <strong>só neste aparelho</strong>, e o compartilhamento entre pessoas
          chega junto com o backend. O resto do app (agenda, materiais etc.) é privado de cada
          pessoa.
        </p>
        <TextEntryForm
          label="Ideia para o MedFoco"
          placeholder="Ex: quero que o calendário me avise por e-mail, ou adicionar banco de questões de Cardiologia..."
          submitLabel="Salvar ideia"
          onSave={add}
        />
      </section>
      <ListaDeIdeias
        titleId="ideias-salvas-title"
        title="Ideias salvas"
        entries={entries}
        loading={loading}
        loadError={loadError}
        emptyText="Nenhuma ideia salva ainda."
        loadErrorText="Não foi possível carregar as ideias."
        meta={(entry) => formatShortDate(toLocalDateKey(new Date(entry.createdAt)))}
        onDelete={remove}
      />
    </>
  );
}
