# Variáveis de ambiente e segredos

## Regra de ouro

**Nenhum valor secreto entra no Git.** O repositório tem apenas o `.env.example`, com os **nomes**
das variáveis e sem valores. O `.gitignore` bloqueia arquivos `.env`, e o CI (gitleaks) e o
GitHub (secret scanning) bloqueiam segredos que escapem.

## Onde cada valor vive

| Local                                        | Para quê                                                 |
| -------------------------------------------- | -------------------------------------------------------- |
| **Gerenciador de senhas** (ex.: Bitwarden)   | Cópia mestra de todos os valores, separados por ambiente |
| `.env` no seu computador (ignorado pelo Git) | Desenvolvimento local                                    |
| GitHub → Settings → Secrets and variables    | Valores usados pelo CI e pelos deploys                   |
| Painel da hospedagem / Supabase              | Valores usados pelo app e pelo backend em cada ambiente  |

## Como configurar localmente

1. `cp .env.example .env`
2. Preencha com os valores de **desenvolvimento** guardados no gerenciador de senhas.
3. Nunca use valores de produção no computador.

## Variáveis previstas

| Variável                 | Ambiente                  | Pública?                | Fase |
| ------------------------ | ------------------------- | ----------------------- | ---- |
| `VITE_SUPABASE_URL`      | app                       | sim (protegida por RLS) | 2    |
| `VITE_SUPABASE_ANON_KEY` | app                       | sim (protegida por RLS) | 2    |
| `VITE_APP_ENV`           | app                       | sim                     | 2    |
| `ANTHROPIC_API_KEY`      | **somente backend**       | **não — segredo**       | 3    |
| `RELEASE_PLEASE_TOKEN`   | GitHub Secrets (opcional) | **não — segredo**       | 0    |

Variáveis com prefixo `VITE_` vão para dentro do app e **qualquer pessoa pode vê-las**: nunca
coloque segredos nelas.

## Ao adicionar uma nova variável

1. Adicione o nome (sem valor) ao `.env.example` e a esta tabela.
2. Guarde os valores no gerenciador de senhas.
3. Configure-a em cada ambiente (GitHub, hospedagem, Supabase).

Se um segredo vazar, siga [runbooks/vazamento-de-segredo.md](runbooks/vazamento-de-segredo.md).
