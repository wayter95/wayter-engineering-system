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
6. **Avaliar impacto:** schema, contrato de API, permissão, tenant, dependências, performance.
7. **Planejar** em 3 a 10 linhas: arquivos a criar/alterar, testes a escrever, ordem.
8. **Implementar** a menor solução correta, em incrementos que compilam. Validação de entrada na fronteira; lógica em serviço testável.
9. **Testar** junto: unit para regra de negócio, integration para rota/query. Em M/L, acionar `tester`.
10. **Revisar.** Em M/L, acionar `reviewer`. Corrigir CRITICAL/HIGH.
11. **Validar** com `.agents/bin/validate.sh`.
12. **Documentar** se afetou: `project.md`, README, `.env.example`, ADR.
13. **Reportar** no formato de `.agents/definition-of-done.md`.

## Saída esperada

Relatório com resultado, arquivos, testes, saída do validate, pendências e riscos.
