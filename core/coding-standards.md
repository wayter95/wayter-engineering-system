# Coding Standards

> Arquivo gerenciado pelo WAYTER Engineering System. Especificidades do projeto (aliases, zonas de componentes, convenções de nome) ficam em `.agents/project.md` e prevalecem sobre este arquivo.

## Gerais

- **Siga o padrão existente do módulo** antes de qualquer preferência pessoal. Consistência local vale mais que a "melhor" forma abstrata.
- **Nomes dizem o que a coisa faz.** Sem abreviações opacas, sem `data2`, sem `utils` como destino de tudo.
- **Funções pequenas e com uma responsabilidade.** Se precisa de comentário para explicar blocos, extraia funções com nomes descritivos.
- **Sem comentários que repetem o código.** Comente apenas o *porquê* não óbvio: workaround, limitação externa, decisão de negócio.
- **Sem código morto**, sem `console.log` de debug, sem TODO sem dono e contexto.
- **Erros são tratados ou propagados**, nunca engolidos. Mensagens de erro dizem o que falhou e com qual entrada (sem vazar segredos).
- **Imutabilidade por padrão.** Evite mutar parâmetros e estado compartilhado.
- **Fronteiras explícitas.** Lógica de negócio não vive em controller, componente de UI ou handler de rota. Ela vive em serviço/use case testável sem framework.

## TypeScript (quando aplicável)

- `strict` sempre. `any` é proibido; use `unknown` e estreite. Se `any` for inevitável (lib sem tipos), isole em um adaptador com comentário do motivo.
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
