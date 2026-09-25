# Banco de dados e migrações

> Entra em uso na **Fase 2** (Supabase). Estas são as regras que valerão a partir de então.

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

| Ambiente | Como as migrações são aplicadas              |
| -------- | -------------------------------------------- |
| Local    | `supabase db reset` (recria do zero + seed)  |
| CI       | Automaticamente, banco temporário            |
| Staging  | Automaticamente, a cada merge na `main`      |
| Produção | No deploy da release, após backup automático |
