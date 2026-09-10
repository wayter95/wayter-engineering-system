# Definition of Done

> Arquivo gerenciado pelo WAYTER Engineering System.

Uma tarefa só é "pronta" quando os itens **aplicáveis** abaixo estão satisfeitos **com evidência**. Evidência é a saída real do comando, não a afirmação de que rodou.

```
[ ] Requisito implementado conforme o pedido (nem mais, nem menos)
[ ] Regras de negócio de .agents/project.md respeitadas
[ ] Dimensionamento respondido no plano e nenhum critério de bloqueio de .agents/engineering-quality.md presente
[ ] Testes criados ou atualizados para o comportamento novo/corrigido
[ ] .agents/bin/validate.sh executado; saída incluída no relatório
    [ ] lint
    [ ] typecheck
    [ ] testes
    [ ] build (quando habilitado no projeto)
    [ ] checagens extras do projeto
[ ] Diff revisado por completo; sem mudanças não relacionadas, sem debug, sem código morto
[ ] Nenhum comentário adicionado ao código (passo `comments` do validate)
[ ] Commit (se pedido) feito pela CLI do git, sem trailer de atribuição de IA
[ ] Nenhum segredo, credencial ou dado real adicionado
[ ] Reviewer sem apontamentos CRITICAL ou HIGH em aberto (tarefas M e L)
[ ] Migration com estratégia de rollback (quando houver)
[ ] ADR criado (quando houve decisão arquitetural)
[ ] Documentação atualizada: project.md, README, .env.example (quando afetados)
```

## Formato do relatório final

```
## Resultado
<uma frase: o que foi entregue>

## Mudanças
- arquivo — o que e por quê

## Validação
<saída resumida do validate.sh, ou "não executado porque ...">

## Fora do escopo / pendências
- <o que ficou de fora e por quê; dívida criada>

## Riscos
- <o que pode dar errado e como reverter>
```

Se algum item não pôde ser cumprido, o relatório diz qual e por quê. Omitir é pior que falhar.
