# Segurança do MedFoco

Resumo do que o app faz e do que ainda precisa ser feito. Resultado da auditoria da etapa 2.13 da
Fase 2. Regras gerais (segredos, LGPD, dados de saúde) estão no [AGENTS.md](../AGENTS.md).

## O que já está protegido

- **Nenhum código executa texto digitado:** não há `eval`, `innerHTML`, `dangerouslySetInnerHTML` nem
  `document.write`. O React escapa todo texto do usuário.
- **Nenhuma chamada de rede:** o app não envia dado nenhum para fora do aparelho (a IA e o login
  são da Fase 3, pelo backend do próprio MedFoco).
- **Links de vídeo** (`apps/web/src/shared/url.ts`): só `http` e `https`; recusa `javascript:`,
  `data:`, `file:` e parecidos (inclusive disfarçados com maiúsculas, tabs e quebras de linha);
  recusa links com usuário e senha; aceita `meusite.com:8080/video` (a porta não é confundida com
  um esquema). A validação roda ao salvar **e** ao ler dados salvos, então um dado adulterado no
  navegador nunca vira link clicável. O link abre com `rel="noopener noreferrer"`.
- **Content-Security-Policy** (`apps/web/csp.ts`): na versão publicada, o navegador só aceita
  scripts, estilos e imagens do próprio app, nenhuma conexão externa e nenhum plugin. Não vale no
  servidor de desenvolvimento (`pnpm dev`), que usa scripts embutidos. Na **Fase 3**, o endereço do
  backend precisa ser acrescentado a `connect-src`. `frame-ancestors` não funciona em `<meta>`:
  precisa de cabeçalho HTTP da hospedagem de produção.
- **Segredos:** nada no repositório; `.env` é ignorado pelo Git; verificação de segredos
  (gitleaks) no CI. **Dependências:** `pnpm audit` no CI.

## Riscos conhecidos (e o que fazer)

1. **Endereço compartilhado no GitHub Pages.** O navegador guarda os dados locais por endereço de
   site, e `davifurias.github.io` é o mesmo para todos os projetos publicados nessa conta. Outro
   projeto publicado no Pages da mesma conta conseguiria ler os dados do MedFoco guardados no
   navegador. Hoje só o MedFoco está publicado lá. **Não publique outro projeto no Pages dessa
   conta enquanto o MedFoco guardar dados reais**, e a versão de **produção** deve usar um
   endereço próprio (domínio ou subdomínio exclusivo).
2. **Cópias de segurança de dados ilegíveis.** Antes de gravar por cima de um conteúdo que não dá
   para ler, o app guarda uma cópia em `medfoco:v1:<área>:backup:<momento>`. Essas cópias ficam só
   no aparelho, mas nunca são apagadas e podem conter texto pessoal. Na Fase 3, definir a limpeza
   (por exemplo, apagar depois de migrar os dados para o backend).
3. **Ações de terceiros do CI fixadas por versão** (por exemplo `@v7`), e não pelo código exato
   (SHA). Fixar pelo SHA protege contra o sequestro de uma ação. O Dependabot já mantém as versões
   atualizadas; fixar por SHA fica como melhoria futura, a ser feita com acesso aos repositórios
   dessas ações.
4. **Vários separadores abertos.** Cada um só vê as mudanças do outro ao recarregar; a
   sincronização de verdade é da Fase 3.

## Ao mexer em links, HTML ou rede

- Todo link vindo do usuário passa por `checkHttpUrl`/`toSafeHttpUrl`.
- Nunca usar `dangerouslySetInnerHTML`, `innerHTML` ou `eval`.
- Qualquer conexão nova (backend, IA) entra em `connect-src` da CSP **no mesmo PR**, com teste.
