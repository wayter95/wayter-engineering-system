# AGENTS.md — {{PROJECT_NAME}}

> Gerado por `wayter sync` (WAYTER Engineering System v{{VERSION}}). **Não edite este arquivo.**
> Conhecimento do projeto: edite `.agents/project.md`. Regras gerais: repositório central do WAYTER + `wayter update`.

Você está operando sob o WAYTER Engineering System. Antes de qualquer tarefa, leia nesta ordem:

1. `.agents/constitution.md` — princípios, hierarquia de instruções, autonomia e limites
2. `.agents/workflow.md` — classificação S/M/L e fluxo do Orchestrator
3. A seção de **Conhecimento do projeto** abaixo (cópia de `.agents/project.md`)
4. Antes de implementar qualquer coisa: `.agents/engineering-quality.md` (performance, robustez, escalabilidade; perguntas obrigatórias no plano)
5. Conforme a área: `.agents/coding-standards.md`, `.agents/security.md`, `.agents/testing.md`, `.agents/git.md`
6. Antes de entregar: `.agents/definition-of-done.md` e `bash .agents/bin/validate.sh`

Papéis disponíveis em `.agents/roles/` (architect, developer, tester, reviewer, devops). Em ambientes com subagentes eles estão instalados como agentes; sem subagentes, assuma cada papel em sequência e anuncie a troca.

Skills em `.agents/skills/`: adopt-project, create-feature, fix-bug, refactor, create-tests, review-code, resolve-conflicts, validate, adr.

**Um comando de shell por vez e um subagente por vez.** Nunca em paralelo; a máquina reinicia por falta de memória. Teste só o que mudou durante o desenvolvimento (`WAYTER_TEST_FILE` ou `validate.sh --fast`); a suíte completa uma vez, no fim, via `validate.sh`.

Ações destrutivas ou externas (push, deploy, migration em produção, deletar dados, mensagens) exigem pedido explícito do usuário. O hook `.agents/hooks/guard-destructive.mjs` bloqueia as mais comuns; não tente contorná-lo.

---

{{PROJECT_MD}}
