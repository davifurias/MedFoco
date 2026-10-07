# Fase 3 — Backend, contas, sincronização e IA real

> **Plano mestre oficial da Fase 3.** Vale para qualquer IA ou pessoa que trabalhe no projeto,
> junto com o [AGENTS.md](../AGENTS.md) (regras gerais) e o
> [fluxo de trabalho](fluxo-de-trabalho.md). Em caso de conflito sobre a Fase 3, este documento
> prevalece sobre os demais em `docs/`; o `AGENTS.md` continua prevalecendo sobre tudo.
>
> Criado em 2026-10-07, com a Fase 2 concluída. **Este documento é só o plano: nenhuma conta,
> chave ou código de backend existe ainda.** A primeira etapa só começa com autorização do dono
> do projeto.

## 1. Objetivo

Hoje o MedFoco funciona por completo, mas **só no aparelho** de quem usa: os dados ficam no
navegador e a IA mostra "ainda não está disponível". A Fase 3 acrescenta, **sem tirar nada do que
já existe**:

- **contas** (entrar em qualquer aparelho);
- **dados na nuvem**, de cada pessoa só para ela, com **sincronização** entre aparelhos;
- **IA real**, sempre pelo servidor do próprio MedFoco (nunca direto do navegador);
- **privacidade (LGPD)** e publicação num endereço próprio.

O ponto de partida está em [preparacao-fase-3.md](preparacao-fase-3.md): a interface
`MedFocoRepository` (30 operações), as 11 listas locais e os 5 pontos de entrada de IA.

## 2. Decisões já tomadas

Aprovadas pelo dono do projeto em 2026-10-07 (e a decisão 0001, de 2026-09-25):

1. **Backend: Supabase** (banco Postgres, login, funções do servidor), na região de São Paulo.
2. **Público: grupo fechado**, por convite (o dono e amigos). Abrir ao público é uma decisão
   futura, com revisão das obrigações da LGPD, do suporte e dos limites de uso da IA.
3. **O app continua funcionando sem conta**, só no aparelho, como hoje. A conta é opcional e
   serve para guardar na nuvem e sincronizar.
4. **Login por e-mail e senha**, com confirmação de e-mail e recuperação de senha. Entrar com
   Google fica como melhoria posterior.
5. **IA no primeiro lançamento: Assessora (conversa) e Sugestão do dia**, com o modelo **Haiku**
   e limite diário por pessoa. Os outros três recursos (organizar a semana, resumir aula em
   vídeo, organizar o Caderno) entram logo depois.
6. **Arquivos (PDF e imagens): depois.** O app original nunca lia PDF de verdade; é recurso novo.
7. **O mural "Ideias do App" continua só pessoal** (compartilhar exigiria moderação).

## 3. O que NÃO faz parte da Fase 3

- Aplicativo de celular, notificações e câmera (**Fase 5**).
- Rotina automática de backups e a regra de restauração periódica (**Fase 4**). Mas o **teste de
  restauração** é obrigatório **antes de convidar a primeira pessoa** (etapa 3.9).
- Entrar com Google, mural compartilhado, envio de arquivos: ficam para depois, só com pedido do
  dono.
- Novas funcionalidades do app. A Fase 3 troca **onde** os dados ficam e **como** a IA responde;
  as telas e regras continuam as mesmas.

## 4. Princípios da Fase 3

1. **Nada que já funciona pode piorar:** o modo sem conta continua idêntico; os 463 testes e os
   112 ponta a ponta continuam passando em todo PR.
2. Cada etapa é executada **isoladamente**, gera **um PR** e só avança com **autorização** do dono.
   Abrir um PR não autoriza a etapa seguinte.
3. **Segurança primeiro:** cada pessoa só enxerga os próprios dados (regras de acesso testadas,
   não só escritas); chaves e senhas nunca no repositório nem no chat.
4. **Nenhuma alteração manual de banco** em staging ou produção: tudo vira migração versionada
   (AGENTS.md, seção 6).
5. **Dados reais nunca saem da produção:** staging e testes só com dados fictícios.
6. **Custo sempre com teto**, configurado antes de ligar qualquer serviço pago (seção 8).
7. **O app é de quem o usa:** exportar e apagar os próprios dados é parte do produto, não extra.

## 5. Etapas

Cada etapa abaixo termina com: testes, `pnpm check`, PR, revisão e merge pelo dono.

### 3.1 — Preparação e ambientes

**Status: concluída.** Feito: `config.toml`, `.env.example`, verificação das migrações no CI (PR
#28), projeto Supabase de staging (São Paulo, plano Free) e conta no Console da Claude API, sem
chave e sem crédito. Staging automático fica para a 3.2; o teto de gasto mensal do Console fica
para a 3.7 (antes de criar qualquer chave). Contas e projetos (ver seção 9, o que o dono precisa fazer); ambientes
**desenvolvimento** (banco local em Docker), **staging** (Supabase Free, dados fictícios) e
**produção** (Supabase Pro, **só criada na etapa 3.9**); cofres de segredos; `supabase/` com
`config.toml`; variáveis em `.env.example` (sem valores); verificação das migrações no CI.
Dependências previstas (confirmadas no PR): ferramenta de linha de comando do Supabase (só
desenvolvimento).

### 3.2 — Banco de dados e regras de acesso

**Status: em andamento** (migração, testes de isolamento e seed prontos para revisão; staging
automático em PR próprio depois; `daily_suggestions` fica para a 3.7). Migrações versionadas para as 11 listas e o perfil (mapa em
[preparacao-fase-3.md](preparacao-fase-3.md), seção 2); **regras de acesso por pessoa (RLS) em
toda tabela**; testes automáticos de isolamento (a pessoa A **nunca** lê, grava nem apaga dado da
pessoa B); dados fictícios para desenvolvimento. Sem mudança nas telas. Padrão **expandir →
migrar → contrair** (AGENTS.md, seção 6).

### 3.3 — Login

**Status: não iniciada.** Criar conta, entrar, sair e recuperar senha, com confirmação de e-mail;
telas acessíveis (teclado, leitor de tela, tema claro e escuro) e navegação do **modo sem conta**
preservada; cadastro **só por convite** (novos cadastros abertos desligados). Dependência
prevista: biblioteca do Supabase para o navegador.

### 3.4 — Dados na nuvem

**Status: não iniciada.** Uma segunda implementação do `MedFocoRepository`, que fala com o
Supabase; **as telas não mudam**. Com conta, os dados vêm da nuvem; sem conta, continuam locais.
Estados de carregamento, erro e "sem internet" tratados. **Testes de contrato:** a mesma bateria
roda contra a versão local e a da nuvem, para garantir o mesmo comportamento.

### 3.5 — Migrar e exportar dados

**Status: não iniciada.** Na primeira entrada com conta, **oferecer** levar os dados do aparelho
para a conta (mostrando quantos itens de cada tipo; **nada é apagado do aparelho** sem a pessoa
confirmar; pode repetir sem duplicar). **"Exportar meus dados"** (arquivo) dentro do app. Para
quem usava o app original (Claude Artifact), um caminho de exportação está registrado em
`docs/ideias.md`: decidir nesta etapa.

### 3.6 — Sincronização entre aparelhos

**Status: não iniciada.** Mudanças feitas num aparelho aparecem nos outros (ao voltar para a aba,
ao reconectar ou em tempo real, conforme a análise da etapa). Regra de conflito a decidir no
início da etapa (proposta: o último a gravar vence, por item). Premissa a confirmar: **com conta,
é preciso internet para gravar** (leitura do que já foi carregado continua); funcionar totalmente
sem internet com conta fica fora desta fase.

### 3.7 — IA real

**Status: não iniciada.** **Antes de criar a chave:** definir o teto de gasto mensal no Console e
comparar o Haiku 4.5 com o Haiku 5.5 (preço e qualidade) para decidir o modelo. Funções do servidor que chamam a IA; a chave **só no servidor**.
Primeiro lançamento: **Assessora** e **Sugestão do dia**, modelo Haiku, trocando os pontos de
entrada de `assessora/services/assessora.ts` (`sendChatMessage`) e
`inicio/services/sugestaoDoDia.ts` (`generateDailySuggestion`). Depois, na mesma etapa ou em PR
seguinte: organizar a semana, resumir aula em vídeo, organizar o Caderno e a aula guiada.

Regras desta etapa:

- **Limite de uso por pessoa** (proposta inicial: 20 pedidos por dia; valor final na etapa),
  tamanho máximo de entrada e saída, e **teto mensal de gasto** na conta da IA.
- **Consentimento antes do primeiro uso:** o app diz o que é enviado à IA, que ela roda em
  servidores nos EUA (transferência internacional de dados, LGPD), e a pessoa aceita ou não.
- **Enviar só o mínimo necessário** e **nunca** afirmar condição de saúde da pessoa (o app
  original fazia isso; não reproduzir).
- **Nada de conteúdo das conversas em logs.** Persistir conversas é decisão da etapa (podem
  conter dados sensíveis).
- Mensagens claras quando o limite acabar ou a IA falhar; nenhuma resposta simulada.

### 3.8 — Privacidade (LGPD)

**Status: não iniciada.** Termo de uso e política de privacidade (rascunho para **revisão
jurídica** do dono; a IA não presta aconselhamento jurídico); consentimentos separados
(guardar dados na nuvem; usar IA); **apagar a conta** com confirmação (apaga os dados na nuvem;
o aparelho segue com a cópia local); revisão dos dados guardados e dos logs; procedimento de
incidente (já existe: `docs/runbooks/vazamento-de-segredo.md`).

### 3.9 — Publicação para o grupo fechado

**Status: não iniciada.** Hospedagem do app e **endereço próprio** (os dados locais são guardados
por endereço de site e `davifurias.github.io` é compartilhado; ver `docs/seguranca.md`); deploy
automático em staging e **deploy manual de produção a partir de uma versão** (`docs/deploy.md`);
faixa "STAGING" fora da produção; política de segurança do navegador com o endereço do backend
em `connect-src`; criação do projeto de **produção (Supabase Pro)**; **backup e teste de
restauração antes do primeiro convite**; convites enviados pelo dono; repetição das auditorias
de segurança e acessibilidade e dos testes ponta a ponta com login.

### 3.10 — Arquivos (PDF e imagens) — adiada

**Status: adiada** (decisão do dono). Só começa com pedido explícito. Exigiria armazenamento de
arquivos com regras de acesso, limites de tamanho e leitura de texto para a IA.

## 6. Regras técnicas

- **Banco:** migrações em `supabase/migrations/`; testes de acesso em `supabase/tests/` (CI,
  com Docker); datas de calendário como `date` e momentos como `timestamptz`; tipos gerados e
  comparados com `data/types.ts`.
- **Leitura tolerante:** reaproveitar as regras de `data/normalize.ts` ao migrar; **nunca apagar**
  o que não puder ser convertido: avisar a pessoa.
- **App:** continua independente de plataforma (`window.claude` proibido); a IA é chamada **só
  pelo servidor** do MedFoco; o navegador nunca recebe chave de IA nem chave privilegiada do
  banco (só a chave pública do Supabase, protegida pelas regras de acesso).
- **Segredos:** só nos cofres do GitHub, do Supabase e da hospedagem; `.env.example` só com
  nomes. Nunca no chat (`AGENTS.md`, seção 7).
- **Ambientes:** staging e produção são projetos Supabase **separados**; dados de produção nunca
  são copiados para outros ambientes.
- **Testes:** todo comportamento novo vem com testes; as regras de acesso têm teste próprio; os
  ponta a ponta passam a cobrir o login.
- **Documentação:** atualizar `docs/` junto com cada etapa (deploy, banco, variáveis, segurança).

## 7. Regra de execução

**Nenhuma IA deve executar a Fase 3 inteira de uma vez.** Fluxo obrigatório de cada etapa:

```
análise → decisões do dono → implementação de uma etapa → testes → commit → PR → revisão →
merge → autorização da próxima etapa
```

**Abrir um PR não autoriza a etapa seguinte.** O merge é feito pelo dono do projeto. Se surgir
uma decisão relevante (regra de negócio, arquitetura, custo, dependência, dados de usuários),
a IA **para e pede orientação**.

## 8. Custos (conferidos em 2026-10-07; valores em dólar)

| Item                                | Custo                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Supabase **Free** (staging)         | $0. Banco de 500 MB. **Pausa após 1 semana sem uso** e não faz backup diário: serve só para testes                   |
| Supabase **Pro** (produção)         | **$25/mês** (primeiro projeto). Banco de 8 GB, 100 mil usuários ativos, 100 GB de arquivos, backup diário por 7 dias |
| Claude API (IA), por uso            | Haiku 4.5: $1 por milhão de tokens lidos e $5 por milhão escritos. Sonnet 5.5: $2 e $10                              |
| Hospedagem do app, endereço próprio | **A confirmar** antes da etapa 3.9                                                                                   |

**Estimativa da IA (hipótese, para dar ordem de grandeza):** cada pedido com cerca de 3 mil tokens
de contexto e 500 de resposta, e 20 pedidos por pessoa por mês, dá cerca de **$0,11 por pessoa por
mês com o Haiku** (100 pessoas: ~$11; 1.000: ~$110) e o dobro com o Sonnet. O custo da IA é
**por uso**: por isso o **teto mensal** e o **limite por pessoa** são obrigatórios antes de ligar
a IA (etapa 3.7). Fontes: [preços do Supabase](https://supabase.com/pricing) e
[preços da Claude API](https://platform.claude.com/docs/en/about-claude/pricing). Preços mudam:
reconferir antes de cada contratação.

## 9. O que o dono do projeto precisa fazer (e quando)

Nada agora. Quando uma etapa pedir, a IA explica o passo a passo. Resumo:

- **Etapa 3.1:** criar a conta no Supabase (de preferência com um e-mail dedicado ao projeto) e o
  projeto de **staging** (gratuito); criar a conta no Console da Claude API e definir um **teto de
  gasto mensal** (antes de qualquer chave existir).
- **Chaves e senhas:** colocá-las **direto** nos cofres (GitHub Secrets, Supabase, hospedagem),
  **nunca no chat nem no repositório**. Guardar uma cópia no gerenciador de senhas.
- **Etapa 3.8:** revisar (com apoio jurídico, se quiser) o termo de uso e a política de
  privacidade.
- **Etapa 3.9:** escolher a hospedagem e o endereço próprio; criar o projeto de produção (Pro);
  enviar os convites.

## 10. Riscos principais

| Risco                                          | Como reduzimos                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| Alguém ler dados de outra pessoa               | Regras de acesso em toda tabela + testes de isolamento obrigatórios (etapa 3.2)       |
| Perder dados na migração                       | Nada é apagado do aparelho sem confirmação; importação repetível; exportação (3.5)    |
| Gasto da IA sair do controle                   | Limite por pessoa, teto mensal e alerta, antes de ligar a IA (3.7)                    |
| Dado de saúde ir parar na IA sem consentimento | Consentimento explícito, mínimo necessário, nenhuma afirmação sobre saúde (3.7 e 3.8) |
| Vazamento de chave                             | Chaves só em cofres; runbook de vazamento; varredura de segredos no CI                |
| Produção quebrar para os convidados            | Deploy manual por versão, backup antes, teste de restauração e rollback documentado   |
| Dados do app misturados com outros sites       | Endereço próprio em produção (3.9)                                                    |

## 11. Critérios para concluir a Fase 3

A Fase 3 só será considerada concluída quando houver:

- projetos de staging e de produção funcionando, com migrações versionadas;
- regras de acesso por pessoa com testes de isolamento passando;
- login (criar conta, entrar, sair, recuperar senha), por convite;
- dados na nuvem e sincronização entre aparelhos, com o modo sem conta intacto;
- migração dos dados locais e "Exportar meus dados";
- IA real (Assessora e Sugestão do dia) com limite por pessoa, teto de gasto e consentimento;
- privacidade (LGPD): termo, consentimentos e apagar a conta;
- publicação em endereço próprio, com backup e **teste de restauração** feitos;
- testes (unitários, de acesso, integração e ponta a ponta com login) e `pnpm check` passando;
- auditorias de segurança e de acessibilidade repetidas;
- documentação atualizada;
- nenhum segredo no repositório.
