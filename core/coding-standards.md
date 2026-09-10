# Coding Standards

> Arquivo gerenciado pelo WAYTER Engineering System. Especificidades do projeto (aliases, zonas de componentes, convenções de nome) ficam em `.agents/project.md` e prevalecem sobre este arquivo.

## Gerais

- **Siga o padrão existente do módulo** antes de qualquer preferência pessoal. Consistência local vale mais que a "melhor" forma abstrata.
- **Nomes dizem o que a coisa faz.** Sem abreviações opacas, sem `data2`, sem `utils` como destino de tudo.
- **Funções pequenas e com uma responsabilidade.** Se um bloco pede explicação, extraia uma função com nome descritivo.
- **Zero comentários no código.** Nenhum comentário em nenhum arquivo: nem explicando o que o código faz, nem descrevendo a tarefa, nem marcadores de seção, nem `TODO`, nem código comentado, nem docblocks/JSDoc. O código se explica por nomes, tipos, testes e estrutura. Contexto que não cabe no código vai para `docs/`, ADR ou `project.md`. Únicas exceções: shebang, diretivas exigidas por ferramenta (`# shellcheck`, `// eslint-disable-next-line` com justificativa em PR, `"use client"`) e cabeçalho de licença quando o projeto já o usa. O validate falha se o diff adicionar comentário.
- **Sem código morto**, sem `console.log` de debug, sem TODO sem dono e contexto.
- **Erros são tratados ou propagados**, nunca engolidos. Mensagens de erro dizem o que falhou e com qual entrada (sem vazar segredos).
- **Imutabilidade por padrão.** Evite mutar parâmetros e estado compartilhado.
- **Fronteiras explícitas.** Lógica de negócio não vive em controller, componente de UI ou handler de rota. Ela vive em serviço/use case testável sem framework.

## Dimensão dos dados: um item ou N itens

Antes de implementar qualquer operação, responda: **isso roda para um item ou para muitos?** A resposta muda o desenho.

- **Operação em N itens é uma operação em lote, não um loop.** Excluir, atualizar, mover ou exportar vários itens selecionados usa `deleteMany`/`updateMany`/`IN (...)`/bulk insert, dentro de uma transação, em um único endpoint que recebe a lista de ids. Nunca um loop chamando o endpoint ou o serviço unitário N vezes, nem no backend, nem no frontend disparando N requests.
- **Reutilizar não é repetir.** "Não duplique lógica" significa extrair a regra comum (validação, autorização, efeitos) para uma função usada pelo caso unitário e pelo caso em lote. Não significa chamar a função unitária em loop.
- **Autorização e tenant no conjunto inteiro.** A query em lote filtra por tenant e verifica posse de **todos** os ids antes de agir; se um id não pertence ao usuário, a operação inteira falha (ou o contrato documenta explicitamente o comportamento parcial). Nunca verifique item a item dentro de um loop.
- **Limites explícitos.** Toda operação em lote tem tamanho máximo validado no DTO (ex.: 500 ids). Acima disso, paginação, job em fila ou processamento em chunks com progresso, decidido em plano.
- **Atomicidade definida.** Tudo ou nada (transação) é o padrão. Resultado parcial só com justificativa e resposta que lista sucesso e falha por item.
- **Efeitos externos agregados.** Um lote não dispara N e-mails, N webhooks ou N eventos individuais sem decisão explícita; agregue ou enfileire.
- **Leitura também é em lote.** Buscar dados de N itens é uma query com `IN`/join, não N queries. N+1 em loop é bug (ver Banco de dados).
- **Frontend**: seleção múltipla chama **um** endpoint em lote e trata o resultado uma vez. Sem `Promise.all` de N chamadas unitárias como substituto de endpoint em lote.

Se o projeto só tem a operação unitária, a tarefa **inclui** criar a versão em lote (serviço + endpoint + teste), reutilizando a regra comum. Isso é o escopo correto, não ampliação de escopo.

## TypeScript (quando aplicável)

- `strict` sempre. `any` é proibido; use `unknown` e estreite. Se `any` for inevitável (lib sem tipos), isole em um adaptador com nome explícito (ex.: `untypedLegacyClient`) e registre o motivo em `project.md`.
- Tipos derivam da fonte de verdade: schema Zod/class-validator, Prisma, OpenAPI. Não duplique tipos à mão.
- Prefira `type` para composição e `interface` para contratos públicos extensíveis; siga o que o módulo já usa.
- Sem `!` de não-nulo para calar o compilador. Trate o caso nulo.
- Sem `enum` novo se o projeto usa union de literais (e vice-versa).
- Imports absolutos via alias do projeto quando existir.

## Backend (NestJS, Express, handlers)

- Toda entrada é validada por DTO/schema **antes** do serviço.
- Escopo de tenant (`organizationId` ou equivalente) vem do contexto autenticado, **nunca do body ou query**.
- Serviços não conhecem HTTP. Controllers não conhecem banco.
- Operações que escrevem em mais de uma tabela usam transação.
- Efeitos externos (e-mail, webhook, fila) são disparados depois do commit, idempotentes e com retry consciente.
- Logs estruturados, com identificadores de correlação, sem PII nem segredos.

## Frontend (React, Next.js)

- Componentes de UI não contêm regra de negócio; recebem dados e callbacks.
- Reutilize antes de criar. Se um elemento pode se repetir, é componente; siga as zonas definidas em `project.md`.
- Estado local por padrão; estado global só com necessidade demonstrada.
- Formulários: validação por schema compartilhado com o backend quando possível.
- Acessibilidade básica não é opcional: labels, foco, contraste, semântica.
- Server/client boundary explícita; nada de segredo em componente cliente.

## Banco de dados

- Toda mudança de schema passa por migration versionada. Nunca `db push`, nunca alteração manual em ambiente compartilhado.
- Migration é backwards-compatible quando há deploy sem downtime: adicionar antes de remover, em passos separados.
- Índices para toda coluna usada em filtro frequente ou FK.
- Queries em loop (N+1) são bug, não estilo.

## Dependências

- Antes de adicionar pacote: o projeto já resolve isso? A plataforma já resolve isso? O pacote é mantido e tem tamanho aceitável?
- Fixe versão conforme a política do lockfile do projeto. Não misture gerenciadores de pacote; use o que `.agents/project.env` declara.
