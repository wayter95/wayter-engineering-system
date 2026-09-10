---
name: validate
description: Executa a Definition of Done do projeto rodando .agents/bin/validate.sh (lint, typecheck, testes, build e checagens extras conforme .agents/project.env), interpreta falhas e reporta com a saída real. Use antes de declarar qualquer tarefa concluída, ou quando o pedido é "valida", "roda os checks", "está tudo passando?".
---

# Skill: Validate

## Passos

1. Rode:
   ```bash
   bash .agents/bin/validate.sh
   ```
   Para um subconjunto: `bash .agents/bin/validate.sh --only lint,typecheck`.
   Durante o desenvolvimento: `bash .agents/bin/validate.sh --fast` (typecheck + testes relacionados aos arquivos alterados + comments).
   O script roda um passo por vez, com `nice`, limite de workers e de memória; não chame as ferramentas diretamente em paralelo.
2. Leia o resumo final. Para cada passo com falha, abra o log indicado (`.agents/.validate/<passo>.log`).
3. Classifique cada falha:
   - **causada pela mudança atual** → corrija e rode de novo
   - **pré-existente** → reporte como tal, com evidência (ex.: falha também em `git stash`), e não a esconda
   - **ambiente** (serviço fora, credencial ausente) → reporte; não marque como passou
4. Nunca desabilite um passo em `project.env` para "fazer passar". Isso é decisão do usuário.
5. Reporte no formato:

```
## Validação
| Passo | Resultado |
|---|---|
| lint | ✓ |
| typecheck | ✓ |
| test | ✗ 2 falhas (pré-existentes: X, Y) |
| build | skip (desabilitado no projeto) |

<detalhe das falhas, se houver>
```
