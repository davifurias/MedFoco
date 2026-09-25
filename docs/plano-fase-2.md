# Fase 2 — Reconstrução do MedFoco

> **Plano mestre oficial da Fase 2.** Vale para qualquer IA ou pessoa que trabalhe no projeto,
> junto com o [AGENTS.md](../AGENTS.md) (regras gerais) e o
> [fluxo de trabalho](fluxo-de-trabalho.md). Em caso de conflito sobre a Fase 2, este documento
> prevalece sobre os demais em `docs/`; o `AGENTS.md` continua prevalecendo sobre tudo.
>
> Estado na criação deste documento (2026-09-25): etapa 2.1 incorporada à `main` (PR #3); etapa
> 2.2 em revisão no PR #4.

## 1. Objetivo

A Fase 2 reconstrói **funcionalmente** o MedFoco original (`legacy/MedFoco.html`) em
**React + TypeScript + Vite**, preservando suas funcionalidades e sua identidade visual
essenciais, mas com uma arquitetura moderna, segura, testável e **independente do Claude
Artifact** (sem `window.claude`).

A Fase 2 é uma **reconstrução funcional local**: o aplicativo funciona por completo num único
navegador, com os dados salvos localmente. **Backend, contas, sincronização e IA real pertencem à
Fase 3.**

## 2. Princípios da Fase 2

1. O `legacy/MedFoco.html` é a **referência funcional e visual**.
2. **Não inventar** funcionalidades sem autorização.
3. **Não remover** funcionalidades existentes sem autorização.
4. Melhorias de **segurança, acessibilidade e arquitetura** são permitidas quando não alterarem o
   objetivo da funcionalidade.
5. Toda etapa é executada **isoladamente**.
6. Toda etapa gera um **Pull Request**.
7. **Nenhuma etapa seguinte é automaticamente autorizada.**
8. O **GitHub é a fonte de verdade** do projeto.
9. A `main` é **protegida**.
10. O histórico **não** é reescrito.
11. O `legacy/MedFoco.html` permanece **preservado** (não editar).
12. **Nenhuma API do Claude Artifact** é utilizada (`window.claude`, `use('db')`, `use('sample')`
    etc.). O CI bloqueia isso.
13. A persistência da Fase 2 é **local**.
14. A arquitetura deve permitir **substituir** a persistência local pelo backend no futuro.

## 3. O que NÃO pertence à Fase 2

Ficam explicitamente **fora** da Fase 2:

- Supabase
- PostgreSQL
- autenticação
- OAuth
- sincronização entre dispositivos
- backend próprio
- Edge Functions
- IA real
- APIs externas de IA
- API keys
- Google Calendar
- pagamentos
- analytics externos
- notificações externas
- funcionalidades sociais
- gamificação
- funcionalidades premium
- expansão de produto que não exista no legado

Essas decisões pertencem a **fases futuras, principalmente à Fase 3**. Se uma etapa da Fase 2
parecer exigir algum desses itens, a IA deve parar e perguntar (seção 13).

## 4. Arquitetura da Fase 2

Fluxo de dependência:

```
Interface (componentes React em features/<área>/components)
   → hooks / services (features/<área>/hooks, features/<área>/services)
      → MedFocoRepository (interface de acesso a dados)
         → persistência local (implementação atual)
```

Regras:

- **Componentes não acessam `localStorage` diretamente.** Eles usam hooks, que usam o repositório
  obtido por `useRepository()`.
- A **implementação atual** do repositório é local (`localStorage`, com chaves versionadas
  `medfoco:v1:*`, tolerante a dados corrompidos e com reserva em memória quando o navegador
  bloqueia o armazenamento).
- Na Fase 3, **outra implementação da mesma interface** (backend) poderá substituir a local **sem
  reescrever as telas**.
- **Regras de negócio** ficam em funções puras e testáveis (ex.: `features/inicio/utils/`), fora
  dos componentes.
- **Datas** passam por um único módulo (`src/shared/date.ts`), que é o único ponto que consulta o
  relógio.
- **Componentes reutilizáveis** entre áreas ficam em `src/components/` (ex.: pílula de categoria,
  item de evento, diálogo de confirmação).
- Cada área tem sua pasta em `apps/web/src/features/<área>/` (mapa em
  `apps/web/src/features/README.md`).

> Situação atual: a navegação e o esqueleto das áreas estão na `main` (etapa 2.1). A camada de
> dados (`apps/web/src/data/`: `MedFocoRepository`, `createLocalRepository`, `useRepository`) e
> `src/shared/date.ts` foram introduzidos pela etapa 2.2 (PR #4) e passam a valer para todas as
> etapas seguintes quando esse PR for incorporado.

## 5. Etapas da Fase 2

Cada etapa segue a regra de execução da seção 12. "Referência" indica o que existe no legado.

### 2.1 — Shell + Navegação

**Status: concluída** (PR #3). Cabeçalho, navegação superior (computador) e inferior (celular)
com as 8 áreas do original, sub-abas de Agenda e Ideias, Busca e Perfil acessíveis, páginas
provisórias.

### 2.2 — Início

**Status: em revisão no PR #4.** Resumo do dia, Travou?, Sugestão da IA (sem IA real), Ações
rápidas, Próximos eventos e Editar perfil, com persistência local. Regras na seção 8.

### 2.3 — Agenda

**Status: não iniciada.** Eventos, tarefas e horários (sub-abas Eventos, Tarefas, Horários).
Referência: criar evento (título, data, categoria, observação), lista de eventos; tarefas com
matéria, prazo e prioridade, pendentes e concluídas; horários fixos em texto livre. O recurso
"Organizar minha semana com IA" existe no legado, mas a IA real é da Fase 3.

### 2.4 — Matérias

**Status: não iniciada.** Reconstrução da área de matérias e estruturas relacionadas existentes no
legado: materiais do tipo arquivo/nota ou aula em vídeo, com matéria, título, anotações e
assuntos-chave, agrupados por matéria. O armazenamento de arquivos enviados depende de storage
(Fase 3): decidir o tratamento antes de implementar. Resumo/questões por IA são da Fase 3.

### 2.5 — Mapa

**Status: não iniciada.** Reconstrução do mapa visual e suas interações existentes: materiais
agrupados por matéria, ligados por assuntos-chave em comum, com detalhes ao tocar num material.

### 2.6 — Questões

**Status: não iniciada.** Reconstrução do banco e da resolução de questões conforme o legado:
desempenho por assunto, prática com filtros de matéria e dificuldade, cadastro de questão com 4
alternativas e explicação, lista de questões.

**Importante: não recriar automaticamente questões de exemplo** (o legado criava 3 ao abrir o
app; esse efeito colateral não deve ser reproduzido).

### 2.7 — Foco

**Status: não iniciada.** Reconstrução do sistema de foco/Pomodoro e das sessões de estudo:
técnicas do legado (25/5, 50/10, 52/17, 15/3 e personalizado), iniciar/pausar/continuar/encerrar,
minutos de hoje e histórico.

**Regra: o tempo efetivamente focado não inclui pausas.** As sessões usam a estrutura já prevista
para o Início (`FocusSession`, tipos `work` e `break`).

### 2.8 — Assessora IA

**Status: não iniciada.** Reconstrução da interface e dos estados da Assessora (aula guiada, chat,
atalhos, anexar material), **sem IA real**. A arquitetura fica preparada para a integração futura
(um serviço com ponto de entrada único, como `features/inicio/services/sugestaoDoDia.ts`).

**Não reproduzir informações pessoais ou de saúde desnecessárias** (o legado afirmava nos textos
enviados à IA que o estudante tem TDAH; isso não deve ser reproduzido).

### 2.9 — Ideias + Caderno

**Status: não iniciada.** Manter a distinção entre:

- **Ideias do App** — mural de sugestões para o MedFoco;
- **Caderno pessoal** — ideias soltas do próprio usuário.

Ideias criadas pelo usuário (inclusive pela ação rápida "Ideia" do Início) vão para o **Caderno
pessoal**. No legado, o mural era compartilhado entre usuários; sem backend, o comportamento de
compartilhamento é da Fase 3.

### 2.10 — Busca

**Status: não iniciada.** Reconstrução da busca existente (eventos, matérias, tarefas, questões,
ideias do app e caderno; mínimo de 2 letras), corrigindo problemas conhecidos sem alterar o
objetivo (ex.: no legado, o resultado "Tarefas" abria a sub-aba Eventos).

### 2.11 — Perfil

**Status: não iniciada.** Reconstrução do perfil e das preferências existentes no legado: curso,
período, matérias, metas e preferências de estudo. Enquanto não houver autenticação, **os dados
são locais**.

### 2.12 — Integração entre módulos

**Status: não iniciada.** Verificar que os módulos compartilham corretamente os mesmos dados e
regras. Exemplos:

- Agenda → Início (eventos e contador de próximos eventos);
- Tarefas → Início (tarefas pendentes);
- Foco → Início (minutos focados hoje, sem pausas);
- Ação rápida Ideia → Caderno.

### 2.13 — Auditoria de segurança

**Status: não iniciada.** Verificar XSS, HTML inseguro, URLs `javascript:`, execução dinâmica, URLs
perigosas (ex.: links de vídeo), dados sensíveis, segredos e dependências.

### 2.14 — Auditoria de acessibilidade

**Status: não iniciada.** Verificar teclado, foco, labels, ARIA, diálogos, contraste, navegação e
responsividade.

### 2.15 — Testes E2E completos

**Status: não iniciada.** Testar os fluxos completos em computador e celular, nos temas claro e
escuro. A ferramenta E2E automatizada ainda não está no projeto (`docs/testes.md`: Playwright "a
definir"); adicioná-la é uma nova dependência e segue a seção 13.

### 2.16 — Auditoria final da Fase 2

**Status: não iniciada.** Verificar arquitetura, funcionalidades, persistência, segurança, testes
e preparação para a Fase 3 (seções 14 e 15).

## 6. Regras de persistência

- A Fase 2 utiliza **persistência local** (no navegador), através do `MedFocoRepository`.
- Os dados **sobrevivem à recarga** da página quando o armazenamento está disponível. Se o
  navegador bloquear o armazenamento, o app continua funcionando, mas os dados ficam só em
  memória.
- Os dados ficam **só naquele navegador e aparelho**; limpar os dados do navegador os apaga.
  Isso é esperado até a Fase 3.
- Dados atualmente conhecidos, conforme os módulos implementados:
  - tarefas;
  - eventos;
  - ideias do caderno;
  - sessões de foco;
  - sugestão do dia;
  - demais entidades que forem reconstruídas (materiais, questões, tentativas, horários, perfil,
    ideias do app etc.).
- Cada nova entidade entra na **interface** `MedFocoRepository` e na implementação local, com
  chave versionada própria.
- **Não criar dados falsos ou exemplos automaticamente** apenas para preencher a interface.

## 7. Regras de data e horário

- Utilizar sempre a **data e a hora locais** do usuário.
- **Não utilizar UTC** para regras que representem "hoje" no aplicativo (no legado, "hoje" virava
  amanhã depois das 21h no Brasil).
- Datas de calendário são guardadas como `AAAA-MM-DD` no fuso local e interpretadas como
  meia-noite local.
- Os testes rodam no fuso `America/Sao_Paulo` (inclusive no CI) para detectar erros de UTC.
- O **tempo de foco** considera apenas tempo efetivamente focado, **excluindo pausas**.

## 8. Regras da tela Início

Decisões já tomadas (etapa 2.2):

- o contador de eventos representa o **total** de eventos futuros (hoje em diante, em ordem de
  data);
- a lista visual mostra **no máximo 5** eventos;
- a **exclusão de evento exige confirmação** (Cancelar / Excluir);
- sugestões de IA podem ter **estados de interface** (vazio, pensando, sugestão, erro), mas **não
  há IA real** na Fase 2 e nenhuma resposta é simulada;
- "Estou perdido" apenas leva à Assessora IA, sem enviar mensagem;
- a data por extenso usa o formato "Sexta-feira, 25 de setembro" (só a primeira letra
  maiúscula);
- **não criar questões de exemplo** automaticamente;
- **não incluir informações de saúde** desnecessárias.

## 9. Regras visuais

Preservar a identidade visual do legado:

- cores (tokens em `apps/web/src/styles/global.css`);
- cards;
- hierarquia;
- tema claro/escuro (automático pelo sistema);
- responsividade (ponto de quebra de 760px: navegação inferior no celular, superior no
  computador; conteúdo com largura máxima de 900px);
- estrutura geral.

São permitidas correções de:

- acessibilidade;
- responsividade;
- segurança;
- bugs;
- problemas técnicos do legado.

Toda mudança visual é verificada em computador e celular, nos temas claro e escuro.

## 10. Segurança

Requisitos:

- nenhum `window.claude`;
- nenhum `dangerouslySetInnerHTML` sem justificativa e sanitização adequada;
- nenhuma URL `javascript:`;
- nenhuma execução dinâmica desnecessária (`eval`, `new Function` etc.);
- nenhum segredo no frontend;
- nenhuma chamada externa não autorizada;
- validação de entradas;
- cuidado com dados sensíveis (dados de saúde são sensíveis pela LGPD).

Textos do usuário são sempre renderizados pelo React como texto, nunca como HTML.

## 11. Testes

Cada etapa deve possuir testes adequados. Quando aplicável:

- testes unitários;
- testes de regras de negócio;
- testes de componentes;
- testes E2E;
- computador;
- celular;
- tema claro;
- tema escuro;
- persistência após recarga;
- console sem erros.

Toda etapa termina com `pnpm check` passando (formato, lint, independência de plataforma, tipos,
testes e build) e com verificação no navegador quando houver mudança visual.

## 12. Regra de execução

**Nenhuma IA deve executar toda a Fase 2 de uma vez.**

Fluxo obrigatório de cada etapa:

```
análise
→ implementação de uma etapa
→ testes
→ commit
→ PR
→ revisão
→ merge
→ autorização da próxima etapa
```

**Abrir um PR não autoriza a execução da etapa seguinte.** O merge é feito pelo dono do projeto.

## 13. Controle de escopo

Se uma decisão relevante aparecer durante uma etapa, a IA deve **parar e solicitar orientação**.
Exemplos:

- alteração importante de regra de negócio;
- alteração arquitetural;
- criação de nova funcionalidade;
- exclusão de funcionalidade;
- dependência relevante;
- alteração que afete várias áreas;
- mudança de comportamento não prevista.

## 14. Critérios para concluir a Fase 2

A Fase 2 só será considerada concluída quando houver:

- funcionalidades reconstruídas;
- módulos integrados;
- persistência funcionando;
- testes passando;
- build passando;
- `pnpm check` passando;
- segurança auditada;
- acessibilidade auditada;
- E2E completo;
- arquitetura preparada para a Fase 3;
- nenhum uso do Claude Artifact.

## 15. Preparação para a Fase 3

A Fase 3 será responsável por:

- backend;
- Supabase;
- autenticação;
- banco de dados;
- sincronização;
- storage (arquivos enviados);
- IA real (sempre pelo backend, nunca direto do navegador);
- segurança server-side.

A Fase 2 prepara **interfaces e abstrações** (como o `MedFocoRepository` e os serviços de IA com
ponto de entrada único) **sem antecipar** essas implementações.

> **Observação sobre a numeração das fases:** documentos criados na Fase 0 (`docs/deploy.md`,
> `docs/banco-e-migracoes.md`, `docs/variaveis-de-ambiente.md`, `docs/testes.md`, `docs/setup.md`,
> `docs/releases.md`, `docs/runbooks/rollback.md`, `supabase/README.md` e o mapa do `AGENTS.md`)
> ainda mencionam o Supabase/backend "a partir da Fase 2", seguindo a numeração do plano
> inicial. **Pela definição atual, esse conteúdo pertence à Fase 3.** A atualização desses
> documentos depende de autorização do dono do projeto.
