# Workflow

> Arquivo gerenciado pelo WAYTER Engineering System.

O fluxo é proporcional ao tamanho da tarefa. Uma alteração de uma linha não passa por seis agentes.

## 1. Classificação da tarefa

| Tamanho | Critério | Fluxo |
|---|---|---|
| **S** | Até ~3 arquivos, sem mudança de schema, contrato de API, dependência ou regra de negócio. Correção óbvia, texto, estilo, ajuste local. | Developer implementa → `validate` → auto-revisão do diff → entrega |
| **M** | Feature ou correção dentro de padrões já existentes, vários arquivos de um módulo, lógica de negócio nova mas contida. | Plano curto → Developer → Tester → Reviewer → `validate` → entrega |
| **L** | Qualquer um: migration/schema, API pública, novo pacote, mudança cross-módulo, auth/permissão/tenant, pagamentos, integração externa, performance crítica, remoção de funcionalidade. | Architect (ADR se houver decisão) → plano **aprovado pelo usuário** → Developer em incrementos → Tester → Reviewer → DevOps check → `validate` → entrega |

**Gatilhos automáticos de escalada para L**, independentemente do tamanho aparente:

- toca `prisma/schema.prisma`, migrations ou equivalente
- toca autenticação, autorização, isolamento de tenant
- toca pagamentos, cobrança, dados financeiros
- adiciona ou remove dependência
- altera contrato consumido por outro sistema (API, evento, webhook, tipo exportado de SDK)
- remove ou desativa validação existente

Na dúvida entre dois tamanhos, escolha o maior.

## 2. Fluxo do Orchestrator

O Orchestrator é a sessão principal (Claude Code, Codex, Cursor). Em ambientes com subagentes, ele delega; em ambientes sem, ele assume cada papel em sequência, anunciando a troca.

```
REQUEST
  ↓
ANALYZE     entender, localizar código, ler docs da área, classificar S/M/L
  ↓
PLAN        3-10 linhas; para L, aguardar aprovação
  ↓
IMPLEMENT   menor mudança correta; incrementos que compilam
  ↓
TEST        Tester: tentar quebrar; criar/atualizar testes
  ↓
REVIEW      Reviewer: bugs, segurança, regressão, escopo
  ↓
FIX         corrigir apontamentos CRITICAL/HIGH; registrar os demais
  ↓
VALIDATE    .agents/bin/validate.sh com saída real
  ↓
REPORT      resumo com evidência + Definition of Done
```

## 3. Delegação

Delegue a um papel quando o trabalho puder ser feito com contexto próprio e retornar um resultado compacto. Não delegue quando a coordenação custar mais que a tarefa.

| Situação | Papel |
|---|---|
| Decisão estrutural, trade-offs, ADR | `architect` |
| Implementação isolada e paralelizável | `developer` |
| Casos de borda, cenários de falha, cobertura | `tester` |
| Revisão final do diff por olhos frescos | `reviewer` |
| Deploy, CI, Docker, migrations em produção | `devops` (quando existir no projeto) |

Regras:

- Passe ao subagente **o objetivo, os arquivos relevantes e os documentos a ler**, não a conversa inteira.
- Peça resultado em formato definido (o papel especifica o formato de saída).
- O Orchestrator integra, não copia cegamente.

## 4. Contexto progressivo

Não carregue toda a documentação. Leia por camadas:

1. `AGENTS.md` (já inclui `.agents/project.md`)
2. A seção de `project.md` que aponta docs da área afetada
3. O código da área e uma implementação semelhante
4. Só então o restante, se necessário

## 5. Quando parar e perguntar

- O pedido admite duas leituras que geram trabalho materialmente diferente.
- O plano exige ação destrutiva ou externa.
- Há conflito entre `project.md` e o código, ou entre o pedido e uma regra.
- A validação falha por motivo fora do seu controle (infra, credencial, serviço externo).

Nos demais casos, decida, declare a premissa e continue.
