# WAYTER Engineering System

Sistema de engenharia para agentes de código (Claude Code, Codex, Cursor). Instala em qualquer repositório um diretório `.agents/` com constituição, workflow S/M/L, papéis (architect, developer, tester, reviewer, devops), skills, Definition of Done, um validador mecânico e um hook que bloqueia ações destrutivas.

O conteúdo genérico vive **aqui** e é copiado para os projetos. O conhecimento específico de cada projeto vive em `.agents/project.md` e `.agents/project.env`, que nunca são sobrescritos.

## Instalação do CLI

```bash
git clone <este-repo> ~/.wayter
ln -s ~/.wayter/bin/wayter /usr/local/bin/wayter
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

Skills do dia a dia: `/create-feature`, `/fix-bug`, `/refactor`, `/create-tests`, `/review-code` (revisão com severidade e veredito, papel `reviewer` como subagente), `/resolve-conflicts` (merge, rebase e cherry-pick preservando os dois lados, com ponto de retorno e verificação em etapas), `/validate`, `/adr`.

| Comando | Efeito |
|---|---|
| `wayter init [dir]` | Instala. Faz backup de `CLAUDE.md`/`AGENTS.md`/`.cursorrules` existentes em `.agents/backup/` antes de gerar os novos. |
| `wayter update [dir]` | Recopia os arquivos gerenciados a partir desta versão. Preserva `project.md` e `project.env`. |
| `wayter sync [dir]` | Regenera `AGENTS.md` (inclui `project.md`), `CLAUDE.md`, `.claude/agents/*`, `.claude/skills/*`, hook em `.claude/settings.json`, `.cursor/rules/wayter.mdc`. Rode após editar `project.md`. |
| `wayter doctor [dir]` | Diagnóstico: versão, arquivos, hook registrado, atribuição de IA desligada, comandos vazios em `project.env`. |

## Regras fortes que o sistema impõe

- **Um comando por vez, um subagente por vez.** Constituição, workflow, todos os papéis, `CLAUDE.md`, `AGENTS.md` e a regra do Cursor proíbem chamadas de shell paralelas, comandos encadeados com `&`, watchers em background e fan-out de agentes. Motivo: a máquina reinicia por falta de memória. Ordem obrigatória: do mais barato ao mais caro, parando no primeiro erro.
- **Validação leve.** `validate.sh` roda cada passo sozinho, em sequência, sob `nice` (`WAYTER_NICE`), com `NODE_OPTIONS=--max-old-space-size` (`WAYTER_NODE_MAX_OLD_SPACE_MB`) e limite de workers exportado para vitest, jest, playwright, cargo, go, turbo e nx (`WAYTER_MAX_WORKERS`). `--fast` roda só typecheck, testes relacionados aos arquivos alterados (`WAYTER_TEST_FAST` com `{files}`) e o check de comentários. `wayter init` já gera comandos com `--maxWorkers`, `tsc --incremental` e `eslint --cache`.

- **Commits só pela CLI do git, sem atribuição de IA.** `git.md` proíbe `Co-Authored-By`, `Generated with Claude Code` e trailers; `wayter sync` grava `includeCoAuthoredBy: false` e `attribution: { commit: "", pr: "" }` em `.claude/settings.json`; o hook bloqueia `git commit` cuja mensagem contenha esses textos, `--author`, `--trailer`, `git add -A`, `git add .` e `git commit -a`.
- **Produção desde a primeira linha.** `engineering-quality.md` obriga a responder volume, frequência, falha, concorrência, dependências, limites e custo antes de implementar, e define o mínimo não negociável: validação com limites, paginação, query em lote sem N+1, transação, idempotência, timeout e retry, trabalho lento em fila, estado fora do processo. O reviewer bloqueia (HIGH) qualquer violação.
- **Zero comentários no código.** `coding-standards.md` proíbe qualquer comentário em qualquer arquivo de código. O passo `comments` do `validate.sh` (`.agents/bin/check-comments.sh`) analisa as linhas adicionadas no diff (e arquivos novos não rastreados) e falha se encontrar comentário. Exceções fixas: shebang e diretivas de ferramenta (`# shellcheck`, `// eslint-disable`, `@ts-expect-error`, `"use client"`, pragmas C). Exclua caminhos com `WAYTER_COMMENTS_EXCLUDE` (regex) ou desligue com `WAYTER_CHECK_COMMENTS=0`.

## O que vai para o projeto

```
.agents/
  constitution.md        princípios, hierarquia de instruções, autonomia e limites
  workflow.md            classificação S/M/L, fluxo do Orchestrator, delegação
  coding-standards.md    padrões gerais, TS, backend, frontend, banco, dependências, operações em lote
  engineering-quality.md performance, robustez e escalabilidade: perguntas obrigatórias, regras por camada, critérios de bloqueio
  security.md            regras invioláveis + checklists por tipo de mudança
  testing.md             princípios, o que testar por camada, mentalidade do Tester
  git.md                 commits convencionais, branches, PR, permissões
  definition-of-done.md  checklist com evidência + formato do relatório final
  roles/                 orchestrator, architect, developer, tester, reviewer, devops
  skills/                adopt-project, create-feature, fix-bug, refactor, create-tests, review-code, resolve-conflicts, validate, adr
  bin/validate.sh        roda lint/typecheck/test/build/comments/extras de project.env; logs em .agents/.validate/
  bin/check-comments.sh  falha se o diff adicionar comentário em arquivo de código
  bin/find-node.sh       localiza um Node >= 18 (PATH, WAYTER_NODE, nvm, fnm, volta, asdf, homebrew)
  hooks/guard-destructive.sh    wrapper registrado no settings.json; chama o .mjs com o Node certo
  hooks/guard-destructive.mjs   PreToolUse hook: bloqueia push, reset --hard, db push, deploy, rm -rf amplo, commit com atribuição de IA, git add -A, etc.
  templates/adr.md, pr.md
  project.md             ← do projeto, nunca sobrescrito
  project.env            ← do projeto, nunca sobrescrito
  VERSION
AGENTS.md                gerado; lido nativamente por Codex/Cursor/Copilot
CLAUDE.md                gerado; importa AGENTS.md e descreve o ambiente Claude Code
.claude/agents/*.md      papéis como subagentes
.claude/skills/*/SKILL.md
.claude/settings.json    hook registrado + atribuição de IA desligada (merge com o existente)
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
| `WAYTER_TEST_FAST` | comando para testar só os arquivos alterados, com `{files}` (usado por `validate.sh --fast`) |
| `WAYTER_NICE` | prioridade de CPU dos passos do validate (padrão 10; 0 desliga) |
| `WAYTER_MAX_WORKERS` | limite de workers/threads exportado para os runners (padrão 2) |
| `WAYTER_NODE_MAX_OLD_SPACE_MB` | heap máximo do Node nos passos do validate (padrão 3072) |
| `WAYTER_CHECK_COMMENTS` | `1` (padrão) roda o passo `comments` no validate |
| `WAYTER_COMMENTS_EXCLUDE` | regex de caminhos ignorados pelo check de comentários (ex.: `^vendor/|\.generated\.` ) |
| `WAYTER_NODE` | caminho de um Node >= 18 quando o `node` do PATH é antigo |
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
- `bin/wayter` é um shim bash que localiza Node >= 18 e executa `bin/wayter.mjs`.
- Sem comentários nos scripts deste repositório também; a documentação vive neste README.
- Teste rápido do hook: `echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | bash core/hooks/guard-destructive.sh`
- Teste do check de comentários no próprio repo: `WAYTER_COMMENTS_EXCLUDE='' bash core/bin/check-comments.sh HEAD` (o script assume `.agents/bin/`, então rode a partir de um projeto instalado ou via `--` no e2e).
