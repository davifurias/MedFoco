# Banco de dados e migrações

> Entra em uso na **Fase 3** (Supabase). Estas são as regras que valerão a partir de então.
>
> **Situação (etapa 3.1):** `supabase/config.toml` existe (cadastro aberto desligado, e-mail
> confirmado, senha de no mínimo 8 caracteres) e o CI tem o job "Migrações do banco (Supabase)", que
> sobe um banco local e aplica as migrações do zero. As migrações começam na etapa 3.2 (seção abaixo) e
> o staging **não** recebe migrações automaticamente: isso entra num PR próprio, depois da 3.2.

## Tabelas e regras de acesso (etapa 3.2)

Migração `20261007120000_cria_tabelas_e_regras_de_acesso.sql`: `tasks`, `events`, `materials`,
`questions`, `attempts`, `focus_sessions`, `notebook_entries`, `app_ideas` e `profiles` (inclui
horários fixos e tema). A Sugestão do dia (`daily_suggestions`) entra na etapa 3.7.

- **Dono:** toda linha tem `user_id` (preenchido pelo banco com quem está logado). Apagar a conta
  apaga os dados dela.
- **Acesso:** RLS ligado em toda tabela; só quem está logado, só as próprias linhas, para ler,
  criar, editar e apagar. Visitante não acessa nada. O acesso é liberado explicitamente por tabela
  (o projeto de staging não expõe tabelas automaticamente).
- **Validações:** valores válidos de prioridade, categoria, dificuldade, tipo e tema; 4 alternativas
  por questão e resposta de 0 a 3; datas como `date`, momentos como `timestamptz`; limites de
  tamanho de texto generosos (título 500, matéria e assunto 200, anotações 20 mil caracteres, link
  2048). **Ao migrar os dados locais (etapa 3.5), o que passar de um limite não é descartado: a
  pessoa é avisada.**
- **Identificadores:** `uuid`. O app já gera UUID; ids fora desse formato (dados muito antigos) serão
  tratados na migração (3.5).
- **Perfil:** uma linha por pessoa, criada pelo app ao salvar (sem gatilho no banco). Pode ter dado
  de saúde em texto livre: sensível pela LGPD.
- **Mural "Ideias do App":** `app_ideas` é pessoal, como decidido.

**Testes:** `supabase/tests/database/isolamento.test.sql` (pgTAP, roda no CI com
`supabase test db`) prova que a pessoa A nunca lê, grava, altera nem apaga dado da pessoa B, que o
visitante não acessa nada e que o banco barra dado malformado. Um teste falha se existir tabela
nova sem RLS. **Para criar uma tabela nova:** inclua-a na lista do teste e nas regras de acesso da
migração.

**Dados fictícios:** `supabase/seed.sql` (só local, `supabase db reset`).

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
