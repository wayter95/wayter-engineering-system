# Engineering Quality: performance, robustez e escalabilidade

> Arquivo gerenciado pelo WAYTER Engineering System. Vale para todo código novo ou alterado, em qualquer tamanho de tarefa. Prevalece sobre "menor mudança" quando os dois conflitam: a menor mudança **correta** já inclui estes requisitos.

Código "que funciona no teste manual com três registros" não está pronto. Todo código é escrito assumindo produção: milhares de registros, centenas de usuários simultâneos, rede lenta, dependência externa fora, processo reiniciado no meio.

## Perguntas obrigatórias antes de implementar

Responda por escrito no plano (uma linha cada). Se a resposta for "não sei", descubra no código ou pergunte.

1. **Volume**: quantos registros esta operação toca hoje e em 10x? Um item ou N?
2. **Frequência**: roda uma vez por clique, por request, por segundo, por item de uma lista?
3. **Falha**: o que acontece se falhar no meio? Fica estado inconsistente? Como se recupera?
4. **Concorrência**: dois usuários (ou dois requests iguais) ao mesmo tempo quebram algo?
5. **Dependência**: chama banco, API externa, fila, arquivo? Cada uma pode estar lenta ou fora.
6. **Limites**: qual o tamanho máximo de entrada, resposta, arquivo, lista? Está validado?
7. **Custo**: quantas queries, quantas chamadas de rede, quanta memória por request?

## Performance

**Banco de dados**
- Uma operação de negócio = número constante de queries, independente de N. Loop com query dentro é bug (N+1), inclusive via lazy loading de ORM.
- Buscar só as colunas necessárias (`select`), nunca a entidade inteira para ler um campo.
- Toda listagem é paginada (cursor de preferência; offset só em listas pequenas) e tem `take` máximo validado.
- Filtro, ordenação e join usam colunas indexadas. Nova query em coluna sem índice exige o índice na mesma tarefa (migration).
- `count` só quando exibido; `exists` em vez de `findMany().length`; agregações no banco, não em memória.
- Nunca carregar uma tabela inteira em memória para filtrar, somar ou exportar. Use query, agregação, cursor ou stream.
- Escritas em massa em uma query (`createMany`, `updateMany`, `deleteMany`, `INSERT ... VALUES (...), (...)`), em chunks de tamanho fixo quando muito grandes.
- Transações curtas: só o que precisa ser atômico; nenhuma chamada externa dentro de transação.

**Rede e I/O**
- Chamadas independentes a serviços distintos podem ser concorrentes (`Promise.all`) **quando são poucas e limitadas**; N chamadas para N itens não, use endpoint em lote ou fila com concorrência limitada.
- Resposta HTTP carrega só o que a tela usa. Sem serializar relações inteiras por conveniência.
- Arquivos grandes via stream, nunca `readFile` inteiro em memória; uploads direto para storage quando a plataforma permite.
- Timeout explícito em toda chamada externa. Padrão do projeto em `project.md`; na ausência, 10s para APIs, 30s para uploads.

**Aplicação**
- Trabalho que leva mais que ~2s ou depende de terceiro lento sai do request: job em fila com status consultável.
- Cache só com decisão documentada (o quê, chave, TTL, invalidação). Cache sem invalidação é bug futuro.
- Nada de computação pesada repetida em loop de render ou em cada request quando pode ser calculada uma vez.
- Complexidade algorítmica importa quando N cresce: `Map`/`Set` para lookup em vez de `find` dentro de `map` (O(n²)).

**Frontend**
- Listas grandes: paginação ou virtualização, nunca renderizar milhares de nós.
- Dados de servidor com cache/dedupe (React Query, SWR ou o padrão do projeto); sem refetch em cascata.
- Sem `useEffect` disparando request por item; um request por tela ou por ação.
- Imagens com tamanho definido e lazy; bundles sem dependência pesada para função trivial.

## Robustez

**Entrada**
- Toda fronteira valida tipo, formato, tamanho, enum e intervalo (DTO/schema). Inclui query params, headers, webhooks, env vars, arquivos e respostas de terceiros.
- Limites máximos explícitos em toda lista, string livre, arquivo e paginação.

**Erros**
- Erro é tratado onde há o que fazer, e propagado onde não há. Nunca engolido (`catch {}`), nunca convertido em `null` silencioso, nunca logado e ignorado em fluxo que deveria falhar.
- Erros esperados (não encontrado, sem permissão, conflito, inválido) têm tipo próprio e status HTTP correto. Erro inesperado vira 500 com log completo e resposta sem detalhe interno.
- Mensagens dizem o que falhou e com que entrada, sem segredo e sem PII.

**Dependências externas**
- Timeout, retry com backoff exponencial e limite de tentativas para falhas transitórias; sem retry para erro 4xx.
- Falha de dependência secundária (e-mail, analytics, webhook de saída) não derruba o fluxo principal: registra, enfileira ou degrada.
- Circuit breaker ou fallback quando a dependência é crítica e instável, decidido em plano.

**Consistência**
- Operações que escrevem em mais de uma tabela são atômicas (transação) ou explicitamente eventualmente consistentes com compensação.
- Toda operação que pode ser repetida (webhook, retry de cliente, mensagem de fila, clique duplo) é idempotente: chave de idempotência, `upsert`, ou verificação de estado antes de agir.
- Efeitos externos disparam **depois** do commit, nunca dentro da transação.
- Concorrência: atualizações que dependem do valor atual usam lock otimista (versão), `UPDATE ... WHERE` condicional ou lock pessimista; nunca "lê, calcula, grava" sem proteção.

**Recursos**
- Conexões, streams, arquivos temporários, listeners e timers são sempre liberados (`finally`, `using`, `AbortController`).
- Processos de longa duração tratam sinais de término e terminam o trabalho em andamento ou o devolvem à fila.

**Observabilidade**
- Log estruturado nas fronteiras (entrada de request, chamada externa, job) com id de correlação, duração e resultado. Sem log em loop por item.
- Erro inesperado sempre logado com stack e contexto suficiente para reproduzir.

## Escalabilidade

- **Stateless por padrão.** Nenhum estado de request em memória do processo (sessão, cache local sem TTL, contador). Estado vai para banco, cache distribuído ou fila.
- **Trabalho assíncrono em fila** para tudo que é lento, em massa ou depende de terceiro: importação, exportação, envio em massa, sincronização, geração de relatório. Com status persistido, retry e idempotência.
- **Processamento em chunks** com tamanho fixo e progresso persistido; um job de 100k itens é retomável de onde parou.
- **Sem dependência de ordem ou de instância única** salvo lock distribuído explícito (cron que não pode rodar em duas instâncias usa lock).
- **Rate limiting e backpressure** em toda entrada pública e em todo consumidor de fila; concorrência de workers configurável.
- **Multi-tenant**: toda query filtra por tenant via índice composto; nenhuma operação varre todos os tenants sem paginação por tenant.
- **Configuração por ambiente**, nunca hardcoded; feature flags para mudanças de comportamento arriscadas.
- **Compatibilidade**: mudanças de schema e de contrato são expansivas primeiro (adicionar), contrativas depois (remover), em deploys separados.

## Quando isso é overengineering

Não é overengineering: validação, limites, transação, idempotência, paginação, índice, timeout, query em lote, log de erro. Esses são o mínimo e custam minutos.

Exige justificativa em plano ou ADR: cache, fila nova, circuit breaker, sharding, microserviço, CQRS, event sourcing, camada de abstração nova. A regra do `architect` continua: demonstre que a solução simples falha antes de propor.

## Critérios de bloqueio na revisão (HIGH ou CRITICAL)

- query em loop; N chamadas para N itens; tabela inteira em memória
- listagem sem paginação ou sem limite
- chamada externa sem timeout; retry sem limite; falha de terceiro derrubando fluxo principal
- escrita em múltiplas tabelas sem transação; efeito externo dentro de transação
- operação repetível sem idempotência
- `catch` vazio ou erro convertido em sucesso silencioso
- estado em memória de processo que precisaria sobreviver a reinício ou a segunda instância
- entrada sem limite máximo; upload sem limite de tamanho
- filtro em coluna sem índice em tabela que cresce
- trabalho lento dentro do request

## Formato no plano

```
## Dimensionamento
- Volume: <n hoje / n em 10x>  ·  Frequência: <...>
- Falha no meio: <o que acontece / como recupera>
- Concorrência: <risco / proteção>
- Dependências externas: <quais / timeout / fallback>
- Limites: <máximos validados>
- Queries por operação: <número constante>
```
