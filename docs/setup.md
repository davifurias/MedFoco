# Configurar o ambiente

O projeto roda igual em qualquer lugar. Os comandos são sempre os mesmos:

| Comando        | O que faz                                             |
| -------------- | ----------------------------------------------------- |
| `pnpm install` | Instala as dependências (versões fixadas no lockfile) |
| `pnpm check`   | Tudo: formato, lint, tipos, testes e build            |
| `pnpm lint`    | Verifica o código e a independência de plataforma     |
| `pnpm test`    | Testes automáticos                                    |
| `pnpm build`   | Gera o aplicativo                                     |
| `pnpm format`  | Formata os arquivos automaticamente                   |

## Computador local

1. Instale o [Node.js 22](https://nodejs.org) (a versão exata está em `.nvmrc`) e o Git.
2. No terminal:
   ```bash
   git clone https://github.com/davifurias/MedFoco.git
   cd MedFoco
   corepack enable
   pnpm install
   pnpm check
   ```
3. A partir da Fase 2, o banco local exige [Docker](https://www.docker.com/) (ver
   [banco-e-migracoes.md](banco-e-migracoes.md)).

## GitHub Codespaces, Gitpod, VS Code Dev Containers, DevPod

O arquivo `.devcontainer/devcontainer.json` descreve o ambiente completo (Node 22, pnpm, Docker).

- **Codespaces:** no GitHub, botão **Code → Codespaces → Create codespace on main**.
- **Gitpod:** abra `https://gitpod.io/#https://github.com/davifurias/MedFoco`.
- **VS Code:** extensão "Dev Containers" → "Reopen in Container".

As dependências são instaladas automaticamente.

## Claude Code

- **No computador:** rode `claude` dentro da pasta do projeto.
- **Na web** (claude.ai/code): selecione o repositório `davifurias/MedFoco`.

O Claude lê o `CLAUDE.md` e o `AGENTS.md` automaticamente. Limitação conhecida na web: pode não
haver Docker; nesse caso os testes que precisam de banco rodam apenas no CI do GitHub.

## Outras IAs

Codex, Cursor, Copilot, Gemini e outras leem o `AGENTS.md`. O processo é o mesmo.
