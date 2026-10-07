# supabase/

Backend do MedFoco, a partir da Fase 3: `config.toml`, `migrations/` (mudanças de banco
versionadas), `seed.sql` (dados fictícios para desenvolvimento), `tests/` (testes de RLS) e
`functions/` (Edge Functions, incluindo a IA). Regras em `docs/banco-e-migracoes.md`.

Hoje existe só o `config.toml` (cadastro aberto desligado: contas só por convite). Migrações em `migrations/` (tabelas e regras de acesso
da etapa 3.2), dados fictícios em `seed.sql` e testes de isolamento em `tests/database/`.
