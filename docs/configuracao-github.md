# Configurações manuais do GitHub

Estas configurações ficam no **painel do GitHub** e não podem ser feitas por arquivos no
repositório. Precisam ser feitas **uma vez** pelo dono do repositório (conta `davifurias`).

## 1. Criar a tag do app original (se ainda não existir)

GitHub → **Releases** → **Draft a new release** → **Choose a tag** → digite `v0.0.1-artifact` →
**Create new tag** → em **Target**, escolha o commit `1070a54` ("Add files via upload") →
título "v0.0.1-artifact — app original (Claude Artifact)" → **Publish release**.

> Faça isso **antes** de incorporar o PR da Fase 0, enquanto `main` ainda aponta para `1070a54`
> (assim "Target: main" também serve).

## 2. Merge somente por "Squash"

**Settings → General → Pull Requests:**

- ✅ Allow squash merging — em "Default commit message", escolha **Pull request title**
- ❌ Allow merge commits
- ❌ Allow rebase merging
- ✅ Always suggest updating pull request branches
- ✅ Automatically delete head branches

## 3. Proteger a `main`

**Settings → Rules → Rulesets → New ruleset → New branch ruleset:**

- Nome: `proteger-main` · Enforcement status: **Active**
- Target branches: **Add target → Include default branch**
- Marque:
  - ✅ Restrict deletions
  - ✅ Block force pushes
  - ✅ Require a pull request before merging
    (Required approvals: **0** — você é o único mantenedor; o controle é o CI + o seu clique)
  - ✅ Require status checks to pass → "Require branches to be up to date" → adicione:
    - `Formato, lint, testes e build`
    - `Verificação de segredos (gitleaks)`
    - `Dependências vulneráveis`
    - `Título no padrão Conventional Commits`
    - `Análise de segurança (CodeQL)`

    (Os nomes só aparecem na lista depois que o CI rodou pelo menos uma vez — ou seja, depois do
    PR da Fase 0.)
- **Bypass list:** deixe vazia.

## 4. Proteger as tags de versão

**Settings → Rules → Rulesets → New ruleset → New tag ruleset:**

- Nome: `proteger-tags` · **Active** · Target: **Include by pattern** → `v*`
- ✅ Restrict deletions · ✅ Restrict updates · ✅ Block force pushes

## 5. Segurança

**Settings → Advanced Security** (ou "Code security"):

- ✅ Dependabot alerts · ✅ Dependabot security updates
- ✅ Secret scanning · ✅ Push protection
- CodeQL: já configurado por arquivo (`.github/workflows/codeql.yml`); não ative o "default setup"
  para não duplicar.

## 6. Permitir que o Release Please abra PRs

**Settings → Actions → General → Workflow permissions:**

- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

## 7. (Recomendado) Token para o PR de release rodar o CI

PRs criados pelo token padrão do GitHub não disparam o CI, então o PR de release ficaria
bloqueado pela proteção da `main`.

1. GitHub → sua foto → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Repository access: **Only select repositories → MedFoco**.
3. Permissions: **Contents: Read and write**, **Pull requests: Read and write**.
4. Copie o token **direto** para: repositório → **Settings → Secrets and variables → Actions →
   New repository secret** → nome `RELEASE_PLEASE_TOKEN`.
5. Guarde uma cópia no gerenciador de senhas. **Nunca cole o token no chat ou em arquivos.**
