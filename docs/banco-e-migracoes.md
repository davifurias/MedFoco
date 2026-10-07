# Banco de dados e migrações

> Entra em uso na **Fase 3** (Supabase). Estas são as regras que valerão a partir de então.
>
> **Situação (etapa 3.1):** `supabase/config.toml` existe (cadastro aberto desligado, e-mail
> confirmado, senha de no mínimo 8 caracteres) e o CI tem o job "Migrações do banco (Supabase)", que
> sobe um banco local e aplica as migrações do zero. Ainda não há migrações (começam na etapa 3.2) e
> o staging **não** recebe migrações automaticamente: isso entra quando houver migrações a aplicar.

## Banco local no seu computador

Precisa de Docker em execução. Comandos (a ferramenta vem com `pnpm install`):

- `pnpm exec supabase start`: sobe o banco local (mostra as chaves **locais**, que são só do seu
  computador e não valem em nenhum outro ambiente).
- `pnpm exec supabase db reset`: recria o banco do zero com as migrações.
- `pnpm exec supabase stop`: desliga.

## Regras

1. **Toda** mudança de estrutura (tabela, coluna, índice, política RLS) é um arquivo SQL em
   `supabase/migrations/`, criado com `supabase migration new <descricao>`.
2. A migração vai no **mesmo PR** da funcionalidade que a usa.
3. O CI aplica todas as migrações do zero num banco limpo e roda os testes de RLS: prova que o
   banco pode ser recriado em qualquer ambiente e que um usuário não lê dados de outro.
4. **Nunca** alterar a estrutura pelo painel do Supabase em staging ou produção.
5. Migrações já incorporadas na `main` **nunca são editadas**: correções viram uma nova migração.

## Expandir → migrar → contrair

Para que voltar o código para a versão anterior nunca exija voltar o banco:

1. **Expandir** (release N): só adicionar tabelas/colunas. A versão anterior do app continua
   funcionando.
2. **Migrar** (release N): o app novo passa a usar a estrutura nova; dados são copiados, se preciso.
3. **Contrair** (release N+1 ou depois): remover o que ficou obsoleto — só quando a versão N já
   estiver estável em produção.

## Onde aplicar

| Ambiente | Como as migrações são aplicadas                              |
| -------- | ------------------------------------------------------------ |
| Local    | `supabase db reset` (recria do zero + seed)                  |
| CI       | Automaticamente, banco temporário (job "Migrações do banco") |
| Staging  | Previsto: a cada merge na `main` (a partir da etapa 3.2)     |
| Produção | No deploy da release, após backup automático                 |
