import { useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useBuscaData } from './hooks/useBuscaData';
import {
  MIN_QUERY_LENGTH,
  SECTIONS,
  SECTION_LIMIT,
  isSearchable,
  searchAll,
  totalResults,
} from './utils/busca';
import './busca.css';

export function BuscaPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // O texto buscado também fica no endereço (?q=): "voltar" e recarregar mantêm a busca. A caixa
  // usa um estado próprio, porque o endereço atualiza com atraso e comeria letras digitadas rápido.
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);
  // Valores que nós mesmos gravamos no endereço: quando eles "voltam" pelo roteador (com atraso),
  // não são uma mudança externa e não podem sobrescrever o que já foi digitado depois.
  const echoes = useRef(new Set<string>());
  const lastTyped = useRef(urlQuery);
  useEffect(() => {
    if (urlQuery === lastTyped.current) {
      echoes.current.clear();
    } else if (!echoes.current.has(urlQuery)) {
      // Mudança vinda de fora (ex.: link ou histórico para outra busca): a caixa acompanha.
      lastTyped.current = urlQuery;
      setQuery(urlQuery);
    }
  }, [urlQuery]);
  const { data, failed, loading } = useBuscaData();

  // Como no app original, a caixa já abre com o cursor dentro.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchable = isSearchable(query);
  const sections = searchable ? searchAll(data, query) : [];
  const total = totalResults(sections);

  let message = '';
  if (!searchable) message = `Digite pelo menos ${MIN_QUERY_LENGTH} letras para buscar.`;
  else if (!loading && total === 0) message = 'Nada encontrado.';
  else if (!loading) message = total === 1 ? '1 resultado.' : `${total} resultados.`;

  const failedLabels = failed.map((key) => SECTIONS.find((s) => s.key === key)?.label ?? key);

  return (
    <>
      <section className="card" aria-labelledby="busca-title">
        <h2 id="busca-title">Busca global</h2>
        <label htmlFor={inputId} className="sr-only">
          Texto da busca
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          placeholder="Buscar em eventos, matérias, tarefas, questões, ideias..."
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            lastTyped.current = value;
            echoes.current.add(value);
            setParams(value ? { q: value } : {}, { replace: true });
          }}
        />
      </section>
      {failedLabels.length > 0 && (
        <div className="empty" role="alert">
          Não foi possível carregar: {failedLabels.join(', ')}. Os resultados dessas áreas não
          aparecem.
        </div>
      )}
      <div className="empty" role="status">
        {message}
      </div>
      {sections.map((section) => (
        <section key={section.key} className="card" aria-labelledby={`busca-${section.key}`}>
          <h2 id={`busca-${section.key}`}>
            <span aria-hidden="true">{section.icon}</span> {section.label} ({section.total})
          </h2>
          <ul className="busca-list">
            {section.items.map((item) => (
              <li key={item.id} className="item">
                <div className="busca-info">
                  {item.title}
                  {item.meta && <div className="meta">{item.meta}</div>}
                </div>
              </li>
            ))}
          </ul>
          {section.total > SECTION_LIMIT && (
            <p className="note">
              Mostrando {SECTION_LIMIT} de {section.total}.
            </p>
          )}
          <Link to={section.to} className="btn secondary busca-ver">
            Ver na aba → <span className="sr-only">{section.label}</span>
          </Link>
        </section>
      ))}
    </>
  );
}
