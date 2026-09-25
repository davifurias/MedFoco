@AGENTS.md

## Específico do Claude Code

As regras do projeto estão todas no `AGENTS.md` acima. Aqui ficam apenas particularidades do
Claude Code:

- **Travas ativas** em `.claude/settings.json`: force push, push na `main`, `git reset --hard`,
  reescrita de histórico, exclusão de tags e leitura de arquivos `.env` estão bloqueados. Não tente
  contorná-las; se uma tarefa parecer exigir isso, pare e explique ao usuário.
- **Sessões na web** (claude.ai/code) trabalham numa branch `claude/…` já definida pela sessão.
  Use essa branch; o título do PR é que segue o padrão Conventional Commits.
- **Limitações conhecidas do ambiente na web:** pode não haver Docker (o Supabase local não sobe)
  e o envio de tags pode ser bloqueado. Nesses casos, rode o que for possível, diga claramente o
  que não pôde ser verificado e deixe o CI do GitHub validar.
- Antes de dizer que terminou, rode `pnpm check`.
