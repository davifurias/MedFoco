# 0001 — Fundação do projeto

- **Data:** 2026-09-25
- **Status:** aceita

## Contexto

O MedFoco nasceu como um único HTML exportado de um Claude Artifact, dependente de APIs internas
(`window.claude.use`) para banco, arquivos, IA e identidade. Isso prende o app a uma plataforma e
não há versionamento, testes nem proteção contra perda.

## Decisões

1. **GitHub é a fonte oficial.** Nada depende de uma plataforma específica.
2. **Branches:** `main` protegida + branches curtas (`feat/`, `fix/`, `chore/`, `claude/`).
   Sem `develop`: para um mantenedor com IA, uma segunda branch longa só gera sincronizações
   arriscadas. A "versão estável" é a **tag de release**, imutável.
3. **Squash merge** com título do PR em Conventional Commits: um commit por mudança na `main`,
   fácil de reverter.
4. **Release Please** para versões (SemVer) e CHANGELOG automáticos.
5. **Protocolo de IA** em `AGENTS.md` (padrão aberto lido por várias ferramentas), com
   `CLAUDE.md` apenas importando-o, e travas técnicas em `.claude/settings.json`, na proteção da
   `main` e no CI.
6. **pnpm + Node 22** fixados; ambiente reproduzível via `.devcontainer/`.
7. **Stack alvo** (fases seguintes): React + TypeScript + Vite (PWA) → Capacitor (mobile);
   Supabase (Postgres, Auth, Storage, Edge Functions) em São Paulo; IA via backend próprio.
8. O HTML original fica em `legacy/` e na tag `v0.0.1-artifact`.

## Consequências

Mais passos por mudança (branch, PR, CI), compensados por: nenhuma mudança quebrada chega à
`main`, toda versão é recuperável e o projeto sobrevive à troca de ferramenta ou de pessoa.
