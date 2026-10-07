import { Link } from 'react-router';
import { FormPerfil } from './components/FormPerfil';
import { usePerfil } from './hooks/usePerfil';

export function PerfilPage() {
  const { profile, loadError, save } = usePerfil();

  return (
    <>
      <section className="card" aria-labelledby="perfil-title">
        <h2 id="perfil-title">Perfil acadêmico</h2>
        <p className="note">
          Estas informações ficam só neste aparelho. Quando a IA da Assessora estiver disponível,
          elas poderão ajudar a personalizar as sugestões.
        </p>
        {loadError ? (
          <div className="empty" role="alert">
            Não foi possível carregar seu perfil.
          </div>
        ) : profile ? (
          <FormPerfil initial={profile} onSave={save} />
        ) : null}
      </section>
      <Link to="/" className="btn secondary btn-block">
        ← Voltar ao início
      </Link>
    </>
  );
}
