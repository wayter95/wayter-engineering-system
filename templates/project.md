# {{PROJECT_NAME}} — conhecimento do projeto

> Arquivo do projeto. `wayter update` não o sobrescreve. Mantido pela skill `adopt-project` e por quem trabalha no repositório.
> Prevalece sobre os arquivos gerenciados de `.agents/` em caso de conflito (ver `.agents/constitution.md`).
> Alvo: até ~300 linhas. Detalhe longo vai para `docs/` com link.

## Visão geral

<!-- Uma ou duas frases: o que o sistema faz e para quem. -->
{{DESCRIPTION}}

## Stack

| Camada | Tecnologia | Observações |
|---|---|---|
| Linguagem | {{LANGUAGE}} | |
| Runtime / framework | {{FRAMEWORK}} | |
| Banco / ORM | {{DATABASE}} | |
| Testes | {{TEST_RUNNER}} | comando de um arquivo em `project.env` (`WAYTER_TEST_FILE`) |
| Gerenciador de pacotes | {{PKG_MANAGER}} | não misturar |

## Comandos

Os comandos canônicos estão em `.agents/project.env` e rodam via `bash .agents/bin/validate.sh`.

| Ação | Comando |
|---|---|
| Subir em dev | `{{DEV_CMD}}` |
| Testar um arquivo | `{{TEST_FILE}}` |
| Migrations | (a confirmar) |

## Arquitetura

<!-- Entradas (rotas, handlers, crons, workers), camadas, onde vive a regra de negócio, DI, padrão de erro. -->
- Entradas: (a confirmar)
- Camadas: (a confirmar)
- Regra de negócio vive em: (a confirmar)
- Comunicação entre módulos: (a confirmar)
- Padrão de erro: (a confirmar)

## Mapa de módulos

| Módulo | Responsabilidade | Arquivos-chave | Docs |
|---|---|---|---|
| | | | |

## Convenções observadas

<!-- O que o código FAZ, não o que gostaríamos. Um exemplo de arquivo por convenção. -->
- Nomes: (a confirmar) — ex.: `src/...`
- Pastas: (a confirmar)
- Testes: (a confirmar) — ex.: `...spec.ts` ao lado do arquivo
- Imports: (a confirmar)

## Regras que historicamente causam bug

<!-- Uma linha por regra, com o porquê. Fontes: commits fix:, comentários NEVER/NUNCA, testes de regressão, ADRs. -->
- (a confirmar)

## Zonas de perigo

<!-- Migrations, multi-tenant, pagamentos, integrações, scripts que tocam produção. Restrições explícitas. -->
- (a confirmar)

## Documentação por área

<!-- Antes de mexer em X, leia Y. Se não há doc, aponte o arquivo de referência. -->
| Área | Ler antes |
|---|---|
| | |

## Decisões

ADRs em `docs/decisions/`. Regras operacionais derivadas de ADRs:
- (nenhuma ainda)

## Permissões e limites deste projeto

- Push: `WAYTER_ALLOW_PUSH` em `project.env`
- Branches: `WAYTER_ALLOW_BRANCH` em `project.env`
- Nunca: (a confirmar — ex.: `db push`, build local, tocar em produção)
