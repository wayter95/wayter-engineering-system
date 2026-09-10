---
name: adopt-project
description: Preenche ou atualiza .agents/project.md com o conhecimento real do repositório: stack, arquitetura, mapa de módulos, comandos, convenções observadas, regras que historicamente causam bug, documentos por área. Use logo após `wayter init` em um projeto, ou quando project.md estiver desatualizado ou vazio.
---

# Skill: Adopt Project

`wayter init` detecta a stack mecanicamente e cria `.agents/project.md` e `.agents/project.env`. Esta skill faz a parte semântica: transformar o repositório em conhecimento útil para agentes.

## Passos

1. **Ler o que já existe.** `.agents/project.md` atual, `README`, `PROJECT.md`, `docs/`, `CLAUDE.md`/`AGENTS.md` antigos em `.agents/backup/`, specs, ADRs. Nada disso pode ser perdido; consolide, não substitua.
2. **Confirmar `project.env`.** Cada comando declarado funciona? (`bash .agents/bin/validate.sh --only lint` etc.). Ajuste gerenciador de pacotes, runner, comando de um arquivo, build habilitado ou não.
3. **Mapear arquitetura.** Entradas (rotas, handlers, crons, workers), camadas, onde vive a regra de negócio, como módulos se comunicam, padrão de DI, padrão de erro.
4. **Mapear módulos.** Tabela: módulo → responsabilidade → arquivos-chave → docs. Em projetos grandes, agrupe por domínio.
5. **Extrair convenções observadas** (não as desejadas): nomes, pastas, testes, imports, forms, i18n, componentes. Cite um exemplo de arquivo para cada.
6. **Extrair "regras que causam bug".** Procure em: commits `fix:`, comentários `IMPORTANT`/`NEVER`/`NUNCA`, docs antigos, testes de regressão. Cada regra em uma linha com o porquê.
7. **Identificar zonas de perigo:** migrations, multi-tenant, pagamentos, integrações, scripts que tocam produção. Registre restrições (ex.: "nunca `db push`", "não rodar build local").
8. **Documentação por área.** Para cada área, qual doc ler antes de mexer. Se não existe, aponte o arquivo de código que funciona como referência.
9. **Escrever `project.md`** seguindo a estrutura do template, conciso: o agente vai ler isso em toda sessão. Detalhe longo vai para `docs/` com link.
10. **Rodar `wayter sync`** para regenerar `AGENTS.md` e adaptadores.
11. **Reportar** o que foi consolidado, o que foi inferido (marcar como "a confirmar") e lacunas.

## Regras

- Marque inferências com `(a confirmar)`. Não invente regra de negócio.
- Prefira link para doc existente a copiar conteúdo.
- `project.md` alvo: até ~300 linhas. Acima disso, mova para `docs/` e linke.
