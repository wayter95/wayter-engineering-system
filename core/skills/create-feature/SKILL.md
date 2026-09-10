---
name: create-feature
description: Implementa uma feature nova do início ao fim seguindo o workflow WAYTER: classificar, ler regras do projeto, encontrar implementação semelhante, planejar, implementar a menor solução, testar, validar e reportar com evidência. Use quando o pedido é "adicionar", "criar", "implementar" algo novo.
---

# Skill: Create Feature

## Passos

1. **Interpretar.** Reescreva a feature em uma frase e liste critérios de aceite observáveis.
2. **Classificar** S / M / L conforme `.agents/workflow.md`. Declare a classificação. Se L, envolva `architect` e apresente o plano antes de implementar.
3. **Ler regras.** `.agents/project.md`: seção da área afetada e "regras que causam bug". Siga os links de documentação que ela indica.
4. **Localizar código.** Módulo alvo, rotas, serviços, tipos, testes existentes.
5. **Encontrar implementação semelhante** no projeto e usá-la como molde de estrutura, nomes e testes.
6. **Dimensionar.** A operação roda para um item ou para N? Para N, desenhe em lote: um endpoint que recebe a lista, uma query (`deleteMany`/`updateMany`/`IN`), transação, limite no DTO, autorização sobre o conjunto inteiro. Nunca loop sobre a operação unitária nem `Promise.all` de N chamadas (`.agents/coding-standards.md` § Dimensão dos dados). Se só existe a versão unitária, criar a versão em lote faz parte da tarefa.
7. **Avaliar impacto e responder o dimensionamento** de `.agents/engineering-quality.md`: volume, frequência, falha no meio, concorrência, dependências externas, limites, queries por operação. Vai no plano como bloco `## Dimensionamento`.
8. **Planejar** em 3 a 10 linhas: arquivos a criar/alterar, testes a escrever, ordem.
9. **Implementar** a menor solução correta, em incrementos que compilam. Validação de entrada na fronteira; lógica em serviço testável.
10. **Testar** junto: unit para regra de negócio, integration para rota/query. Em M/L, acionar `tester`.
11. **Revisar.** Em M/L, acionar `reviewer`. Corrigir CRITICAL/HIGH.
12. **Validar** com `.agents/bin/validate.sh`.
13. **Documentar** se afetou: `project.md`, README, `.env.example`, ADR.
14. **Reportar** no formato de `.agents/definition-of-done.md`.

## Saída esperada

Relatório com resultado, arquivos, testes, saída do validate, pendências e riscos.
