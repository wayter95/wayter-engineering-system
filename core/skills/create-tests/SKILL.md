---
name: create-tests
description: Cria ou completa testes para um módulo, arquivo ou comportamento: mapeia o que existe, lista hipóteses de falha por categoria, escreve testes que protegem comportamento real, roda e reporta cobertura qualitativa. Use quando o pedido é "testar", "criar testes", "cobrir", "aumentar cobertura".
---

# Skill: Create Tests

Assuma a mentalidade do papel `tester` (`.agents/roles/tester.md`).

## Passos

1. **Delimitar.** Qual módulo/arquivo/comportamento? Qual runner e comando de um arquivo (`.agents/project.env`: `WAYTER_TEST_FILE`)?
2. **Mapear o existente.** Testes atuais da área, fixtures, factories, mocks, padrões de nome.
3. **Entender o comportamento.** Leia o código e a regra de negócio em `project.md`. Liste comportamentos observáveis.
4. **Listar hipóteses de falha** por categoria (`.agents/testing.md`): entrada inválida, estado inconsistente, concorrência, dependência externa, autorização, limites.
5. **Priorizar**: regra de negócio, dinheiro, permissão, dados. UI trivial e código gerado por último.
6. **Escrever testes** seguindo os padrões da área. Nome descreve comportamento. Arrange/Act/Assert. Determinísticos.
7. **Rodar** o arquivo. Se um teste revela bug real, **não corrija o código**; reporte com reprodução.
8. **Rodar a suíte da área** para garantir que não quebrou nada.
9. **Reportar**: testes adicionados, comportamentos cobertos, bugs encontrados, o que ficou sem cobertura e por quê.
