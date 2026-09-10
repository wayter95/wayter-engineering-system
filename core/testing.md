# Testing

> Arquivo gerenciado pelo WAYTER Engineering System. Runner, comandos e localização dos testes estão em `.agents/project.env` e `.agents/project.md`.

## Princípios

- **Teste faz parte da entrega.** Feature sem teste é feature incompleta.
- **Todo bug corrigido ganha um teste de regressão** que falha antes da correção e passa depois.
- **Teste comportamento, não implementação.** Renomear uma função privada não deve quebrar testes.
- **Nunca edite um teste para fazê-lo passar** sem entender por que ele falhou. Se o comportamento mudou de propósito, atualize o teste e diga isso no relatório.
- **Testes determinísticos.** Sem dependência de relógio real, rede, ordem de execução ou dados de outro teste.

## O que testar, por camada

| Camada | Foco | Tipo |
|---|---|---|
| Funções puras, helpers, cálculos | entradas válidas, inválidas, limites, nulos | unit |
| Serviços / use cases | regra de negócio, ramificações, erros esperados | unit com dependências mockadas |
| Repositórios / queries | escopo de tenant, filtros, ordenação | integration (banco de teste) |
| Controllers / rotas | validação de entrada, auth, status codes, formato de resposta | integration |
| Fluxos críticos (login, pagamento, sync) | caminho feliz + falhas principais | e2e, poucos e valiosos |

## Mentalidade do Tester

Não pergunte "funciona?". Pergunte "como isso falha?":

- entrada vazia, nula, gigante, com caracteres especiais, em outro encoding
- estado inconsistente (registro deletado no meio, tenant errado, permissão revogada)
- concorrência (dois requests iguais ao mesmo tempo; idempotência)
- dependência externa lenta, fora, ou devolvendo erro/dado malformado
- retry, timeout, mensagem duplicada na fila
- limites (paginação no fim, número máximo, data em fronteira de fuso)
- autorização (usuário de outro tenant, papel insuficiente, token expirado)

## Convenções

- Nome do teste descreve o comportamento: `rejeita pagamento duplicado com mesmo idempotencyKey`, não `test1`.
- Arrange / Act / Assert visíveis.
- Um assert conceitual por teste; vários asserts só se verificam a mesma afirmação.
- Fixtures e factories em vez de objetos gigantes copiados.
- Rodar **um arquivo** de teste durante o desenvolvimento; a suíte completa em `validate`.

## Cobertura

Cobertura é indicador, não meta. Prioridade: regra de negócio, dinheiro, permissão, dados. UI trivial e código gerado não precisam de cobertura.
