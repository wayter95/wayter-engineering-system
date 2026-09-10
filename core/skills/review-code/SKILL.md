---
name: review-code
description: Revisa um diff, branch ou PR como engenheiro sênior externo: intenção vs. implementação, módulos afetados, regras de negócio, segurança, testes, regressões. Devolve apontamentos com severidade e veredito. Use quando o pedido é "revise", "review", "veja se está certo", ou antes de concluir tarefas M/L.
---

# Skill: Review Code

Assuma o papel `reviewer` (`.agents/roles/reviewer.md`) ou delegue a ele.

## Passos

1. **Obter o diff.** `git diff`, `git diff <base>...HEAD`, ou os arquivos indicados. Sem diff claro, peça.
2. **Entender a intenção.** O que o autor quis fazer? Está declarado (commit, PR, pedido)?
3. **Ler além do diff.** Chamadores, dependentes, testes existentes da área.
4. **Checar regras do projeto**: `.agents/project.md` (regras que causam bug), `.agents/security.md`, `.agents/coding-standards.md`.
5. **Checar testes:** cobrem o novo comportamento? cobrem regressão? foram alterados para passar?
6. **Checar escopo:** há mudanças não relacionadas?
7. **Rodar** o que for barato e revelador: typecheck, testes da área.
8. **Reportar** no formato do papel `reviewer`, com veredito.

## Regras

- Não invente problema. "Aprovado, sem apontamentos" é resposta válida.
- Todo apontamento tem arquivo:linha, impacto e correção sugerida.
- Separe o que bloqueia (CRITICAL/HIGH) do que é melhoria.
