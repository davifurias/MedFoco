# Link de teste do MedFoco

**Endereço:** https://davifurias.github.io/MedFoco/

Abre o MedFoco direto no navegador do celular ou do computador, sem instalar nada. Dá para
salvar na tela inicial do celular (no navegador: "Adicionar à tela de início").

## Como funciona

- Mostra sempre a versão atual da `main`. É atualizado **automaticamente cerca de 2 minutos
  depois de cada merge** (automação `.github/workflows/link-de-teste.yml`).
- Os dados ficam **só no aparelho e navegador** de quem usa (armazenamento local). Nada é enviado
  a servidor. O que você cria no celular não aparece no computador (isso chega na Fase 3).
- O link é público, como o repositório: qualquer pessoa com o endereço abre o app, mas cada uma
  vê apenas os próprios dados.
- Limpar os dados do navegador apaga os dados do MedFoco naquele aparelho.

## Configuração (uma vez só)

No GitHub: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
Depois disso, a próxima publicação acontece no próximo merge. Para publicar na hora:
**Actions → Link de teste → Run workflow**.

## Detalhes técnicos

- O app é gerado com o subendereço `/MedFoco/` (`vite build --base=/MedFoco/`), e as rotas usam
  esse subendereço como base (`import.meta.env.BASE_URL` em `apps/web/src/main.tsx`).
- O GitHub Pages não tem "SPA fallback": a automação copia `index.html` para `404.html`, para que
  recarregar ou abrir direto um endereço como `/MedFoco/agenda/tarefas` funcione. Nas
  ferramentas de desenvolvedor do navegador aparece um aviso "404" nesses casos; é esperado.
