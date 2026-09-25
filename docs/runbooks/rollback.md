# Runbook: voltar para uma versão anterior (rollback)

Regra: **o histórico nunca é apagado.** Voltar é sempre uma nova ação registrada.

## Código

| Situação                              | O que fazer                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mudança só numa branch / PR aberto    | Fechar o PR, ou `git revert` do commit na branch.                                                                                                                                                      |
| Mudança já incorporada na `main`      | Nova branch → `git revert <commit do PR>` → PR "revert: …" → CI → merge.                                                                                                                               |
| Versão ruim em **produção** (Fase 2+) | 1) Hospedagem: promover o deploy anterior (mais rápido) **ou** rodar o deploy de produção com a tag anterior. 2) Depois, PR de revert na `main` para a próxima release não trazer o problema de volta. |

Pedindo à IA: "desfaz essa alteração" / "volta a produção para a versão v0.3.0". Em produção ela
explica o plano e espera confirmação.

## Banco de dados (Fase 2+)

1. Graças ao padrão **expandir → migrar → contrair**, voltar o código normalmente **não** exige
   voltar o banco: a estrutura nova é compatível com a versão anterior do app.
2. Se uma migração precisar ser desfeita: criar uma **nova migração corretiva**, via PR e CI.
   Nunca editar ou apagar uma migração já aplicada.
3. **Último recurso** (dados corrompidos): restaurar o backup — ver
   [restaurar-backup.md](restaurar-backup.md). Isso pode perder dados gravados depois do backup:
   só com decisão explícita do dono do projeto.
