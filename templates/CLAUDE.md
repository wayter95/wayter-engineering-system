# CLAUDE.md

> Gerado por `wayter sync`. Não edite; edite `.agents/project.md`.

@AGENTS.md

## Ambiente Claude Code

- Papéis em `.claude/agents/` (architect, developer, tester, reviewer{{DEVOPS_AGENT}}). Delegue conforme `.agents/workflow.md` § Delegação.
- Skills em `.claude/skills/` (`/adopt-project`, `/create-feature`, `/fix-bug`, `/refactor`, `/create-tests`, `/review-code`, `/validate`, `/adr`).
- Hook PreToolUse `guard-destructive` ativo em `.claude/settings.json`. Se um comando for bloqueado, explique ao usuário e peça que ele execute ou autorize.
- Sempre termine com o relatório de `.agents/definition-of-done.md` e a saída real de `bash .agents/bin/validate.sh`.
