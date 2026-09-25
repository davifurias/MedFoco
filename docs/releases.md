# Versões e releases

## Como as versões funcionam

Usamos **Versionamento Semântico** (`vMAJOR.MINOR.PATCH`):

| Tag               | Significado                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `v0.0.1-artifact` | O HTML original exportado do Claude Artifact (preservado)         |
| `v0.1.0`          | Fase 0 concluída: fundação do repositório                         |
| `v0.x.0`          | Cada fase/conjunto de novidades enquanto o app está em construção |
| `v0.x.1`          | Somente correções sobre a `v0.x.0`                                |
| `v1.0.0`          | Primeira versão pública oficial                                   |

Uma tag nunca muda: `v0.2.0` é para sempre exatamente aquele código.

## Como criar uma release (automático)

A ferramenta **Release Please** faz o trabalho:

1. A cada PR incorporado na `main`, ela atualiza um PR chamado
   **"chore(main): release X.Y.Z"**, com o `CHANGELOG.md` escrito a partir dos títulos dos PRs.
   - `feat:` → nova versão MINOR (ex.: 0.1.0 → 0.2.0)
   - `fix:` → nova versão PATCH (ex.: 0.2.0 → 0.2.1)
   - `docs:`, `chore:`, `test:`… → não geram versão sozinhos.
2. Quando quiser publicar, **aprove e faça merge desse PR de release**.
3. A tag `vX.Y.Z` e a Release no GitHub são criadas automaticamente.
4. A partir da Fase 2: dispare o deploy de produção dessa tag (ver [deploy.md](deploy.md)).

> **Observação:** PRs criados pelo token padrão do GitHub não disparam o CI. Como a `main` exige
> CI verde, configure o segredo `RELEASE_PLEASE_TOKEN` (ver
> [configuracao-github.md](configuracao-github.md)) para que o PR de release também seja testado.

## Como ver ou baixar uma versão antiga

- GitHub → **Releases** (ou **Tags**) → escolha a versão → **Source code (zip)**.
- Pelo terminal: `git checkout v0.1.0` (só para olhar; para voltar em produção, veja
  [runbooks/rollback.md](runbooks/rollback.md)).
