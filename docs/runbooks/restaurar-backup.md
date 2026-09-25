# Runbook: backups e restauração

> Os backups entram em funcionamento na **Fase 4**, obrigatoriamente antes de haver usuários
> reais. Este documento registra o que o GitHub **não** protege e como será protegido.

## O que o GitHub protege

Todo o **código**, as **migrações** do banco, a **configuração de CI** e a **documentação**.

## O que o GitHub NÃO protege

| Dado                          | Onde vive                              | Backup                                                                                                                                                    |
| ----------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco de dados de produção    | Supabase                               | Backup diário do Supabase (plano Pro) **+** `pg_dump` diário criptografado em armazenamento externo (ex.: Backblaze B2 / Cloudflare R2). Nunca no GitHub. |
| Arquivos enviados (PDFs etc.) | Supabase Storage                       | Não entram no backup do banco: cópia periódica para o armazenamento externo.                                                                              |
| Segredos e chaves             | GitHub Secrets / Supabase / hospedagem | Cópia mestra no gerenciador de senhas; em caso de perda, gerar novas chaves.                                                                              |
| Configurações de painel       | Supabase / hospedagem / GitHub         | O máximo possível em arquivo (`supabase/config.toml`); o resto em checklist ([configuracao-github.md](../configuracao-github.md)).                        |

## Teste de restauração

Backup que nunca foi restaurado não é backup. Uma vez por mês: restaurar o backup mais recente
num projeto **temporário** (nunca sobre a produção) e conferir que os dados estão íntegros.
O passo a passo detalhado será escrito na Fase 4.
