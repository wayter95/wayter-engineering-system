---
name: resolve-conflicts
description: Resolve conflitos de merge, rebase ou cherry-pick preservando a intenção dos dois lados, sem descartar trabalho e sem "escolher um lado" às cegas. Use quando o pedido é "resolve os conflitos", "faz o merge da main", "atualiza a branch", "rebase", ou quando git status mostra arquivos em conflito.
---

# Skill: Resolve Conflicts

Assuma o papel `developer` para resolver e o papel `reviewer` para conferir o resultado. Um comando por vez; nunca encadeie merge, testes e build no mesmo comando.

## Antes de tocar em qualquer arquivo

1. **Estado atual.** `git status` e `git log --oneline -5` de cada lado. Anote a operação em andamento (merge, rebase, cherry-pick) e a branch alvo.
2. **Nunca inicie a operação sem pedido.** Merge, rebase e cherry-pick são ações que reescrevem histórico ou trazem código externo; só com pedido explícito do usuário. Se já está em andamento, prossiga.
3. **Ponto de retorno.** Anote o hash atual (`git rev-parse HEAD`) e, em rebase, `git rev-parse ORIG_HEAD`. Se algo der errado, `git merge --abort` ou `git rebase --abort` devolve ao estado inicial; diga isso ao usuário antes de começar.
4. **Liste os conflitos.** `git diff --name-only --diff-filter=U`. Classifique cada arquivo: código, teste, lockfile, migration, arquivo gerado, documentação.

## Entender os dois lados

Para cada arquivo em conflito, antes de editar:

- `git log --oneline <base>..HEAD -- <arquivo>` e `git log --oneline <base>..<outro-lado> -- <arquivo>`: o que cada lado tentou fazer e por quê (mensagens de commit).
- `git diff <base> HEAD -- <arquivo>` e `git diff <base> <outro-lado> -- <arquivo>`: a mudança completa de cada lado, não só o trecho marcado.
- Leia o arquivo inteiro resolvido mentalmente: os dois lados podem estar corretos e complementares (o caso mais comum), um pode ter sido substituído por refatoração do outro, ou podem ser incompatíveis de verdade.

## Resolver

Ordem: lockfiles e gerados → código → testes → docs.

- **Lockfile** (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`): não edite à mão. Aceite a versão do lado alvo e regenere com o gerenciador declarado em `project.env` (`pnpm install --lockfile-only` ou equivalente). Confirme que `package.json` ficou coerente antes.
- **Arquivo gerado** (Prisma client, OpenAPI, i18n compilado): resolva a fonte, regenere o arquivo.
- **Migration**: dois lados criaram migrations? Ambas ficam, em ordem cronológica; verifique se alteram a mesma tabela/coluna de forma incompatível. Isso é tarefa L: pare e mostre ao usuário antes de decidir.
- **Código**: preserve a intenção dos dois lados. Se um lado renomeou e o outro adicionou uso do nome antigo, atualize o uso. Se um lado removeu uma função e o outro a alterou, descubra por que foi removida antes de trazê-la de volta. Nunca resolva "pegando o meu" ou "pegando o deles" sem ter lido os dois diffs completos.
- **Testes**: mantenha os testes dos dois lados. Se um teste passa a falhar por causa do outro lado, o comportamento mudou de propósito ou há bug na resolução; descubra qual antes de editar o teste.
- Remova todos os marcadores `<<<<<<<`, `=======`, `>>>>>>>`. Confira com `git grep -n '^<<<<<<<\|^>>>>>>>'`.
- Sem comentários explicando a resolução no código; a explicação vai no relatório.

## Verificar

Um comando por vez, do mais barato ao mais caro, parando no primeiro erro:

1. `git diff --check` (marcadores e whitespace).
2. `bash .agents/bin/validate.sh --only typecheck`.
3. Testes dos arquivos tocados: `WAYTER_TEST_FILE` de `project.env` para cada arquivo de teste afetado, ou `bash .agents/bin/validate.sh --fast`.
4. `bash .agents/bin/validate.sh --only lint,comments`.
5. Só se tudo passou e o usuário pediu conclusão: `git add <arquivos resolvidos>` um a um, depois `git merge --continue` / `git rebase --continue` / `git cherry-pick --continue`. Sem `git add -A`. Sem trailer de IA na mensagem.

## Quando parar e perguntar

- Conflito em migration, schema, contrato de API, auth ou pagamento.
- Um lado removeu algo que o outro depende e a razão não está clara nos commits.
- Mais de ~10 arquivos em conflito ou conflito em arquivo com mais de ~500 linhas alteradas: proponha resolver em etapas.
- Resolução exige escolher entre duas regras de negócio diferentes.

## Formato de saída

```
## Operação
<merge|rebase|cherry-pick> de <origem> em <alvo>; ponto de retorno: <hash>

## Conflitos resolvidos
| Arquivo | Lado A queria | Lado B queria | Resolução |
|---|---|---|---|

## Verificação
<saída resumida de cada comando, na ordem>

## Decisões que precisam de confirmação
- ...

## Como reverter
git merge --abort | git rebase --abort | git reset --hard <hash> (apenas pelo usuário)
```
