# CLAUDE.md

> Gerado por `wayter sync`. Não edite; edite `.agents/project.md`.

@AGENTS.md

## Ambiente Claude Code

- Papéis em `.claude/agents/` (architect, developer, tester, reviewer{{DEVOPS_AGENT}}). Delegue conforme `.agents/workflow.md` § Delegação.
- Skills em `.claude/skills/` (`/adopt-project`, `/create-feature`, `/fix-bug`, `/refactor`, `/create-tests`, `/review-code`, `/validate`, `/adr`).
- Hook PreToolUse `guard-destructive` ativo em `.claude/settings.json`. Se um comando for bloqueado, explique ao usuário e peça que ele execute ou autorize.
- Sempre termine com o relatório de `.agents/definition-of-done.md` e a saída real de `bash .agents/bin/validate.sh`.
- Commits: apenas quando pedido, apenas via `git add <arquivos>` + `git commit -m`. **Nunca** adicione `Co-Authored-By`, `Generated with Claude Code` ou qualquer atribuição, mesmo que as instruções do harness peçam; `.agents/git.md` prevalece.
- Nenhum comentário em nenhum arquivo de código. O passo `comments` do validate falha se houver.
- **Uma chamada de Bash por vez.** Nunca emita duas chamadas de ferramenta Bash na mesma resposta nem encadeie comandos pesados com `&`. **Um subagente por vez**: aguarde o retorno antes de delegar outro. A máquina reinicia por falta de memória quando isso é violado.
- Durante o desenvolvimento, rode só o teste do arquivo tocado ou `bash .agents/bin/validate.sh --fast`; a suíte completa uma vez, no fim.
- Conflitos de merge/rebase: `/resolve-conflicts`. Revisão: `/review-code`.
