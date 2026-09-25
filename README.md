# MedFoco

Aplicativo de organização e estudos para estudantes de Medicina: agenda, tarefas, materiais,
banco de questões, timer de foco e uma assessora de estudos com IA pensada para quem tem TDAH.

> **Estado atual: Fase 0 (fundação).** O aplicativo original, exportado de um Claude Artifact,
> está preservado em [`legacy/MedFoco.html`](legacy/) e na tag `v0.0.1-artifact`. A nova versão
> independente começa na Fase 1.

## Rodar em 5 minutos

Pré-requisitos: [Node.js 22](https://nodejs.org) e Git.

```bash
git clone https://github.com/davifurias/MedFoco.git
cd MedFoco
corepack enable      # ativa o pnpm na versão fixada no projeto
pnpm install
pnpm check           # formato, lint, tipos, testes e build
```

Também funciona sem instalar nada no computador: GitHub Codespaces, Gitpod ou VS Code com Dev
Containers usam a configuração em `.devcontainer/`. Detalhes em [docs/setup.md](docs/setup.md).

## Documentação

| Para…                                      | Leia                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| Pedir mudanças à IA, aprovar, desfazer     | [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md)         |
| Regras que toda IA/pessoa segue no projeto | [AGENTS.md](AGENTS.md)                                         |
| Configurar o ambiente                      | [docs/setup.md](docs/setup.md)                                 |
| Rodar os testes                            | [docs/testes.md](docs/testes.md)                               |
| Variáveis de ambiente e segredos           | [docs/variaveis-de-ambiente.md](docs/variaveis-de-ambiente.md) |
| Criar uma release                          | [docs/releases.md](docs/releases.md)                           |
| Deploy                                     | [docs/deploy.md](docs/deploy.md)                               |
| Banco de dados e migrações                 | [docs/banco-e-migracoes.md](docs/banco-e-migracoes.md)         |
| Voltar para uma versão anterior            | [docs/runbooks/rollback.md](docs/runbooks/rollback.md)         |
| Configurações manuais do GitHub            | [docs/configuracao-github.md](docs/configuracao-github.md)     |
| Ideias futuras                             | [docs/ideias.md](docs/ideias.md)                               |
| Por que as decisões foram tomadas          | [docs/decisoes/](docs/decisoes/)                               |

## Princípios

- **O GitHub é a fonte oficial.** Nada depende de uma plataforma específica, nem do Claude.
- **A `main` é protegida.** Toda mudança passa por branch → Pull Request → CI verde → merge.
- **Versões são tags imutáveis** (`v0.1.0`, `v1.0.0`…). Dá para voltar a qualquer uma.
- **Nenhum segredo no repositório.**
