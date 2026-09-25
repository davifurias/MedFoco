# Runbook: um segredo vazou

Se uma chave, token ou senha apareceu num commit, PR, log, chat ou captura de tela:

1. **Considere a chave comprometida.** Apagar o arquivo ou o commit **não** resolve: o valor já
   pode ter sido copiado.
2. **Revogue/rotacione imediatamente** no serviço de origem (Anthropic Console, Supabase,
   GitHub…) e gere uma nova.
3. Atualize a nova chave no gerenciador de senhas e nos locais onde ela é usada (GitHub Secrets,
   hospedagem, Supabase). Nunca no código.
4. Remova o valor do código num PR normal (`fix: remove segredo exposto`). Não reescreva o
   histórico.
5. Verifique os logs de uso do serviço para detectar uso indevido.
6. Registre o ocorrido (data, o que vazou, o que foi feito).
