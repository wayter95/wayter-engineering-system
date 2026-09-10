# {{PROJECT_NAME}} — conhecimento do projeto

> Arquivo do projeto. `wayter update` não o sobrescreve. Mantido pela skill `adopt-project` e por quem trabalha no repositório.
> Prevalece sobre os arquivos gerenciados de `.agents/` em caso de conflito (ver `.agents/constitution.md`).
> Alvo: até ~300 linhas. Detalhe longo vai para `docs/` com link.

## Visão geral

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
| Testar só o que mudou | `bash .agents/bin/validate.sh --fast` |
| Migrations | (a confirmar) |

## Arquitetura

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

- Nomes: (a confirmar) — ex.: `src/...`
- Pastas: (a confirmar)
- Testes: (a confirmar) — ex.: `...spec.ts` ao lado do arquivo
- Imports: (a confirmar)

## Regras que historicamente causam bug

- (a confirmar)

## Zonas de perigo

- (a confirmar)

## Documentação por área

| Área | Ler antes |
|---|---|
| | |

## Decisões

ADRs em `docs/decisions/`. Regras operacionais derivadas de ADRs:
- (nenhuma ainda)

## Permissões e limites deste projeto

Variáveis de `.agents/project.env` (referência completa no README do WAYTER):
- Push: `WAYTER_ALLOW_PUSH` · Branches: `WAYTER_ALLOW_BRANCH` · Comentários no código: `WAYTER_CHECK_COMMENTS` (1 = falha no validate)
- Nunca: (a confirmar — ex.: `db push`, build local, tocar em produção)
