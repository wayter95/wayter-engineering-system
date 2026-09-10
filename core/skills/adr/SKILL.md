---
name: adr
description: Registra uma decisão arquitetural em docs/decisions/NNN-titulo.md no formato ADR (contexto, opções, decisão, consequências). Use quando uma tarefa L envolveu escolha entre alternativas, nova dependência, mudança de padrão, ou quando o usuário pede "documenta essa decisão".
---

# Skill: ADR (Architecture Decision Record)

## Quando criar

- escolha entre alternativas com trade-off real
- nova dependência, serviço ou infraestrutura
- mudança ou exceção a um padrão do projeto
- decisão que alguém vai questionar daqui a seis meses

Não crie ADR para decisões óbvias ou reversíveis em minutos.

## Passos

1. Liste `docs/decisions/` e pegue o próximo número sequencial (três dígitos).
2. Crie `docs/decisions/NNN-<slug>.md` a partir de `.agents/templates/adr.md`.
3. Preencha: contexto, opções consideradas (com prós/contras), decisão, justificativa, consequências (positivas e negativas), alternativas rejeitadas e por quê.
4. Status: `proposto` até o usuário aprovar; depois `aceito`. Uma decisão substituída recebe `substituído por NNN`.
5. Se a decisão cria uma regra operacional (ex.: "toda query leva organizationId"), adicione uma linha em `.agents/project.md` apontando para o ADR.
6. Reporte o caminho do arquivo e um resumo de duas linhas.
