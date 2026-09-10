---
name: refactor
description: Refatora código preservando comportamento: confirma cobertura de testes, define objetivo mensurável, faz mudanças incrementais com testes verdes entre cada passo. Use quando o pedido é melhorar estrutura, extrair, renomear, reduzir duplicação, sem mudar funcionalidade.
---

# Skill: Refactor

Refatoração muda estrutura, **não comportamento**. Se o comportamento vai mudar, é feature ou fix, não refactor.

## Passos

1. **Objetivo.** Uma frase: o que melhora e como será verificado (menos duplicação, dependência removida, função menor, nome claro).
2. **Entender o comportamento atual.** Leia o código e os testes. Liste os comportamentos observáveis que devem ser preservados.
3. **Confirmar rede de segurança.** Rode os testes da área. Se a cobertura é insuficiente para detectar quebra, **escreva testes de caracterização primeiro**, que descrevem o comportamento atual (mesmo que ele seja estranho).
4. **Planejar passos pequenos.** Cada passo deixa o código compilando e os testes verdes: extrair função → mover → renomear → remover duplicata.
5. **Executar um passo por vez**, rodando typecheck e testes entre eles.
6. **Não misturar.** Se encontrar um bug durante a refatoração, anote e reporte; não corrija no mesmo diff, salvo se trivial e explicitado.
7. **Comparar.** Comportamento igual? Assinaturas públicas preservadas ou consumidores atualizados?
8. **Validar** com `.agents/bin/validate.sh`.
9. **Reportar**: objetivo atingido? métricas antes/depois quando fizer sentido (linhas, duplicações, dependências).

## Escalada

Refatoração que toca contrato público, schema ou mais de um módulo é tarefa L: envolva `architect`.
