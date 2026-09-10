---
name: fix-bug
description: Corrige um bug pela causa raiz, não pelo sintoma: reproduzir, isolar a causa, escrever teste de regressão que falha, corrigir, validar. Use quando o pedido descreve comportamento errado, erro, exceção, "não funciona", "está quebrado".
---

# Skill: Fix Bug

```
REPRODUCE → ROOT CAUSE → REGRESSION TEST (falha) → FIX → TESTS (passam) → REVIEW → VALIDATE
```

## Passos

1. **Reproduzir.** Obtenha o passo a passo, log, stack trace ou request. Se não for reproduzível, escreva o teste que *deveria* reproduzir e confirme que ele falha. Sem reprodução, não há correção confiável.
2. **Localizar.** Siga o stack trace ou os dados até o ponto onde o valor errado nasce, não onde ele explode.
3. **Causa raiz.** Responda: por que o código produziu esse resultado? Quais outras entradas produzem o mesmo erro? Onde mais o mesmo padrão existe? Verifique `.agents/project.md` "regras que causam bug"; muitos bugs são reincidência conhecida.
4. **Teste de regressão** que falha com o código atual. Nome descreve o comportamento correto.
5. **Corrigir** no ponto da causa. Não adicione `if` defensivo no sintoma se a origem está a montante.
6. **Verificar o mesmo padrão** em código vizinho; se existir, reporte (ou corrija, se trivial e no escopo).
7. **Rodar** o teste de regressão e a suíte da área.
8. **Revisar** o diff. Em M/L, acionar `reviewer`.
9. **Validar** com `.agents/bin/validate.sh`.
10. **Reportar**: causa raiz em uma frase, correção, teste, ocorrências semelhantes encontradas.

## Proibido

- corrigir só o sintoma
- editar o teste que denunciou o bug
- silenciar o erro com try/catch vazio ou type cast

## Saída esperada

```
## Causa raiz
<uma ou duas frases>

## Correção
- arquivo — o que mudou

## Teste de regressão
- arquivo::nome — falhava porque X, agora passa

## Mesmo padrão em
- <outros lugares, ou "não encontrado">

## Validação
<saída>
```
