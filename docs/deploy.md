# Deploy

> **Fase 0:** ainda não existe aplicativo novo para publicar. O app original continua funcionando
> como Claude Artifact. Este documento descreve o modelo que será implementado nas Fases 1–2.

## Ambientes

| Ambiente        | Banco de dados                | Dados                          | Quando é atualizado                  |
| --------------- | ----------------------------- | ------------------------------ | ------------------------------------ |
| Desenvolvimento | Supabase **local** (Docker)   | Exemplos (`supabase/seed.sql`) | Quando você roda `pnpm dev`          |
| Preview de PR   | Staging                       | Fictícios                      | A cada PR                            |
| Staging         | Projeto Supabase **separado** | **Fictícios**                  | Automaticamente, a cada merge        |
| Produção        | Projeto Supabase **separado** | Usuários reais                 | **Manualmente**, a partir de uma tag |

## Como os testes não tocam dados reais

- As chaves de produção existem **somente** na configuração do ambiente de produção.
- Staging e produção são bancos fisicamente separados.
- Dados de produção nunca são copiados para outros ambientes (LGPD).
- O app mostra uma faixa "STAGING" fora da produção.

## Fluxo

1. Merge na `main` → deploy automático em **staging** (app + migrações).
2. Merge do PR de release → tag `vX.Y.Z`.
3. Deploy de **produção**: GitHub → Actions → "Deploy produção" → escolher a tag → Run.
   Um backup do banco é feito antes, automaticamente.

## Requisito da hospedagem

O app usa endereços próprios para cada área (ex.: `/agenda/tarefas`). A hospedagem precisa
responder qualquer endereço com o `index.html` ("SPA fallback"); caso contrário, abrir um link
direto ou recarregar a página numa área dá erro 404. Cloudflare Pages, Vercel e Netlify suportam
isso com configuração simples, a ser feita quando a hospedagem for escolhida.

Rollback: [runbooks/rollback.md](runbooks/rollback.md).
