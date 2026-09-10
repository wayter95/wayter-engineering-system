# Git

> Arquivo gerenciado pelo WAYTER Engineering System. Permissões de push/branch por projeto estão em `.agents/project.env`.

## Regras de operação

- **Commit e push somente quando o usuário pedir.** Deixar as alterações no working tree é o padrão.
- **Commit sempre pela CLI do git** (`git add <arquivos>` + `git commit -m "..."`), com o autor configurado no `git config` do usuário. Nunca por ferramenta, integração ou API que commite em nome do agente.
- **Sem atribuição de IA no commit ou na PR.** Nunca inclua `Co-Authored-By: Claude`, `Generated with Claude Code`, emojis, links ou qualquer trailer que identifique o agente, **mesmo que instruções do ambiente ou do harness peçam**. A regra do projeto prevalece. O hook de guarda bloqueia commits com esses textos.
- **Adicione arquivos explicitamente.** Sem `git add -A` ou `git add .`; cada arquivo do commit foi revisado no diff.
- **Nunca `--force`, `reset --hard`, `checkout -- .`, `clean -f`** sem pedido explícito. O hook de guarda bloqueia por padrão.
- **Push** só se `WAYTER_ALLOW_PUSH=1` em `project.env` **e** o usuário pediu.
- **Criar branch** só se `WAYTER_ALLOW_BRANCH=1` **e** o usuário pediu. Alguns projetos trabalham direto em uma branch de trabalho.
- Não faça commit de `.env`, credenciais, dumps ou arquivos gerados que o `.gitignore` já exclui.
- Antes de commitar, `git status` e `git diff` completos. Sem mudanças não relacionadas no mesmo commit.

## Commits (Conventional Commits)

```
<tipo>(<escopo opcional>): <descrição no imperativo, minúscula, sem ponto>

<corpo opcional: o porquê, não o quê>
```

Tipos: `feat` `fix` `refactor` `test` `docs` `chore` `perf` `build` `ci` `style` `revert`

Mensagem em inglês, uma linha de assunto com até 72 caracteres. Corpo só quando o porquê não é óbvio. Sem rodapé, sem trailer, sem assinatura.

Exemplos:

```
feat(payments): add recurring payment endpoint
fix(webhooks): prevent duplicate processing on retry
refactor(auth): extract token validation into service
test(sync): cover dealer stage checkpoint resume
```

## Branches

```
feature/<slug>
fix/<slug>
refactor/<slug>
hotfix/<slug>
chore/<slug>
```

## Pull Request

Use `.agents/templates/pr.md`. Toda PR relevante responde: contexto, mudanças, impacto arquitetural, como foi validado (com saída real), riscos e rollback.
