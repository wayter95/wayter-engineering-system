# WAYTER Engineering System

Sistema de engenharia para agentes de código (Claude Code, Codex, Cursor). Instala em qualquer repositório um diretório `.agents/` com constituição, workflow S/M/L, papéis (architect, developer, tester, reviewer, devops), skills, Definition of Done, um validador mecânico e um hook que bloqueia ações destrutivas.

O conteúdo genérico vive **aqui** e é copiado para os projetos. O conhecimento específico de cada projeto vive em `.agents/project.md` e `.agents/project.env`, que nunca são sobrescritos.

## Instalação do CLI

```bash
git clone <este-repo> ~/.wayter
ln -s ~/.wayter/bin/wayter /usr/local/bin/wayter   # ou adicione ~/.wayter/bin ao PATH
wayter version
```

Requer Node >= 18. Sem dependências.

## Uso em um projeto

```bash
cd meu-projeto
wayter init          # cria .agents/, detecta stack, gera AGENTS.md, CLAUDE.md, .claude/, .cursor/
wayter doctor        # verifica a instalação
bash .agents/bin/validate.sh --list
```

Depois, no Claude Code, rode `/adopt-project` para preencher `.agents/project.md` com o conhecimento real do repositório (arquitetura, módulos, regras que causam bug, zonas de perigo).

| Comando | Efeito |
|---|---|
| `wayter init [dir]` | Instala. Faz backup de `CLAUDE.md`/`AGENTS.md`/`.cursorrules` existentes em `.agents/backup/` antes de gerar os novos. |
| `wayter update [dir]` | Recopia os arquivos gerenciados a partir desta versão. Preserva `project.md` e `project.env`. |
| `wayter sync [dir]` | Regenera `AGENTS.md` (inclui `project.md`), `CLAUDE.md`, `.claude/agents/*`, `.claude/skills/*`, hook em `.claude/settings.json`, `.cursor/rules/wayter.mdc`. Rode após editar `project.md`. |
| `wayter doctor [dir]` | Diagnóstico: versão, arquivos, hook registrado, comandos vazios em `project.env`. |

## O que vai para o projeto

```
.agents/
  constitution.md        princípios, hierarquia de instruções, autonomia e limites
  workflow.md            classificação S/M/L, fluxo do Orchestrator, delegação
  coding-standards.md    padrões gerais, TS, backend, frontend, banco, dependências
  security.md            regras invioláveis + checklists por tipo de mudança
  testing.md             princípios, o que testar por camada, mentalidade do Tester
  git.md                 commits convencionais, branches, PR, permissões
  definition-of-done.md  checklist com evidência + formato do relatório final
  roles/                 orchestrator, architect, developer, tester, reviewer, devops
  skills/                adopt-project, create-feature, fix-bug, refactor, create-tests, review-code, validate, adr
  bin/validate.sh        roda lint/typecheck/test/build/extras de project.env; logs em .agents/.validate/
  hooks/guard-destructive.mjs   PreToolUse hook: bloqueia push, reset --hard, db push, deploy, rm -rf amplo, etc.
  templates/adr.md, pr.md
  project.md             ← do projeto, nunca sobrescrito
  project.env            ← do projeto, nunca sobrescrito
  VERSION
AGENTS.md                gerado; lido nativamente por Codex/Cursor/Copilot
CLAUDE.md                gerado; importa AGENTS.md e descreve o ambiente Claude Code
.claude/agents/*.md      papéis como subagentes
.claude/skills/*/SKILL.md
.claude/settings.json    hook registrado (merge com o existente)
.cursor/rules/wayter.mdc
docs/decisions/          ADRs
```

## `project.env`

| Variável | Uso |
|---|---|
| `WAYTER_PKG_MANAGER` | npm, pnpm, yarn, bun |
| `WAYTER_LINT`, `WAYTER_TYPECHECK`, `WAYTER_TEST`, `WAYTER_BUILD` | comandos do `validate.sh`; vazio = passo pulado |
| `WAYTER_BUILD_ENABLED` | `1` roda build no validate |
| `WAYTER_TEST_FILE` | comando para um arquivo, com `{file}` |
| `WAYTER_EXTRA_CHECKS` | `nome=comando;nome=comando` |
| `WAYTER_VALIDATE_TIMEOUT` | segundos por passo |
| `WAYTER_ALLOW_PUSH`, `WAYTER_ALLOW_BRANCH` | liberam `git push` / criação de branch no hook (o agente ainda precisa de pedido do usuário) |
| `WAYTER_GUARD_EXTRA` | regex adicionais bloqueadas, separadas por `;` |
| `WAYTER_GUARD_DISABLE` | `1` desliga o hook |
| `WAYTER_DEVOPS` | `1` instala o papel devops como subagente (também automático com `Dockerfile` ou `.github/workflows`) |

## Desenvolvimento deste repositório

- `core/` espelha o que vai para `.agents/`. Edite aqui e rode `wayter update` nos projetos.
- `templates/` são usados pelo CLI para gerar `project.md`, `project.env`, `AGENTS.md`, `CLAUDE.md` e a regra do Cursor. Placeholders `{{NOME}}`.
- Suba `VERSION` (semver) a cada mudança em `core/` ou `templates/`.
- Teste rápido do hook: `echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | node core/hooks/guard-destructive.mjs`
