# Security

> Arquivo gerenciado pelo WAYTER Engineering System.

## Regras invioláveis

1. **Segredos nunca entram no repositório**, em log, em mensagem de erro ou em resposta de API. Leia de env; documente a variável em `.env.example` sem valor real.
2. **Tenant vem da autenticação.** Identificador de organização/conta/usuário usado para filtrar dados vem do token ou sessão, nunca de parâmetro controlado pelo cliente.
3. **Autorização em toda rota que muda estado ou lê dado privado.** Autenticado não significa autorizado. Verifique papel e posse do recurso.
4. **Toda entrada externa é hostil até ser validada.** Inclui webhooks, arquivos enviados, respostas de terceiros e variáveis de ambiente.
5. **Nunca desative uma validação, guard ou checagem para "fazer funcionar".** Se ela está errada, corrija-a em tarefa própria, com teste.

## Checklist por tipo de mudança

**Nova rota / endpoint**
- [ ] autenticação exigida (ou justificativa explícita para pública)
- [ ] autorização por papel e por posse do recurso
- [ ] DTO/schema valida tipo, tamanho, formato e enum de cada campo
- [ ] rate limit quando exposta publicamente
- [ ] resposta não vaza campos internos (ids de outros tenants, hashes, tokens)

**Query ou mutação em banco**
- [ ] escopo de tenant presente e vindo do contexto autenticado
- [ ] sem interpolação de string em SQL; parâmetros sempre
- [ ] paginação em listagens

**Integração externa / webhook**
- [ ] assinatura ou token do webhook verificado antes de processar
- [ ] idempotência por id do evento
- [ ] timeout e retry definidos; falha do terceiro não derruba o fluxo principal
- [ ] URL de destino não é controlada pelo usuário sem allowlist (SSRF)

**Upload / arquivos**
- [ ] tipo validado por conteúdo, não só extensão
- [ ] tamanho máximo
- [ ] nome de arquivo sanitizado; armazenado fora do webroot ou em storage externo

**Frontend**
- [ ] sem `dangerouslySetInnerHTML` com conteúdo não sanitizado
- [ ] tokens em cookie httpOnly, não em `localStorage`, salvo decisão documentada do projeto
- [ ] nada sensível em componente cliente ou em variável `NEXT_PUBLIC_*`

**Dependências**
- [ ] pacote novo justificado; verificar manutenção e vulnerabilidades conhecidas

## Dados de produção

- Nenhum agente executa comando em banco de produção sem pedido explícito e revisão do comando exato.
- Scripts de correção de dados rodam em dry-run por padrão e imprimem o que fariam.
- Exportações de dados reais para ambiente local exigem anonimização.
