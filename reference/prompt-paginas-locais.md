# Template de prompt — geração de página serviço × cidade (anti-doorway)

Este é o prompt que o **plugin de AI do scaffold MSIA** usa para gerar conteúdo
único de uma página de serviço numa cidade nova que o aluno cadastrar. Ele
preenche o mesmo shape de `paginas-locais.json`:
`{ servico_slug, cidade_slug, intro_unica, bairros_atendidos, faq_local, depoimento }`.

> **Regra de ouro (anti-doorway):** a página NÃO pode ser a mesma com a cidade
> trocada. Cada cidade tem bairros, referências e perfil de obra próprios — o
> texto precisa citar isso de forma específica. Se duas páginas ficarem iguais
> trocando só o nome da cidade, o Google trata como doorway e penaliza.

## Variáveis de entrada (preenchidas pelo plugin a partir de `servicos.json` e `locais.json`)

- `{{servico_nome}}` — ex: "Aluguel de andaime fachadeiro"
- `{{servico_kw}}` — ex: "aluguel de andaime fachadeiro"
- `{{servico_resumo}}` — o resumo do serviço (contexto do que ele é)
- `{{cidade}}` — ex: "Santo André"
- `{{uf}}` — ex: "SP"
- `{{bairros}}` — lista de bairros, ex: ["Centro", "Vila Assunção", "Utinga"]
- `{{referencias}}` — pontos/vias de referência, ex: ["Av. Industrial", "região do ABC"]
- `{{nome_empresa}}` — de `config.json`

## Prompt

```
Você é redator de SEO local em PT-BR, na voz de uma locadora de andaimes real.
Escreva o conteúdo ÚNICO da página de "{{servico_nome}}" para a cidade de
{{cidade}}/{{uf}}. Contexto do serviço: {{servico_resumo}}

Bairros atendidos na cidade: {{bairros}}
Referências locais (vias, regiões, pontos): {{referencias}}

REGRAS DE ESCRITA (obrigatórias):
- PT-BR, voz comercial concreta. Demonstra, não promete. Nada de "no mundo de
  hoje", "você sabia", "em um cenário cada vez mais", nem conclusão vazia.
- Parágrafos de no máximo 3 linhas. Frases curtas. Fale com "você".
- Cite bairros e referências REAIS da lista acima, ligando-os ao tipo de obra
  típico daquela região (ex: galpão perto de rodovia, prédio alto em bairro
  verticalizado, comércio no centro). NÃO invente bairro nem ponto que não
  esteja na lista.
- Mencione NR-18 / segurança / ART só quando o serviço pedir (montagem em
  altura, balancim, escoramento, plataforma). Não force em serviço simples.
- Use a keyword "{{servico_kw}}" de forma natural na intro. Zero stuffing.
- PROIBIDO: escrever um texto genérico onde dá pra trocar {{cidade}} por outra
  cidade sem mudar mais nada. Se o texto não cita nada específico de {{cidade}},
  está errado — reescreva.

GERE EXATAMENTE NESTE FORMATO JSON:
{
  "servico_slug": "<slug do serviço>",
  "cidade_slug": "<slug da cidade>",
  "intro_unica": "<2 a 3 parágrafos curtos. Abre conectando o serviço ao perfil
     de obra de {{cidade}}, citando ao menos 2 bairros e 1 referência da lista.
     Fecha dizendo que atende os bairros e a entrega é no canteiro.>",
  "bairros_atendidos": [<os bairros de {{bairros}}>],
  "faq_local": [
    { "pergunta": "<pergunta que cita um bairro ou referência de {{cidade}}>",
      "resposta": "<resposta de 1 a 2 frases, específica da região>" },
    { "pergunta": "<2ª pergunta local, outro ângulo (entrega, norma, modelo)>",
      "resposta": "<resposta específica>" }
  ],
  "depoimento": {
    "texto": "<depoimento curto e plausível de cliente, em 1ª pessoa, citando um
       bairro de {{cidade}} e o serviço realizado. Tom de obra, sem exagero.>",
    "autor": "<Nome P., função — Bairro de {{cidade}}>"
  }
}
```

## Checklist que o plugin deve validar na saída

1. A `intro_unica` cita ao menos 2 bairros + 1 referência da cidade. ✅
2. O `depoimento` cita um bairro daquela cidade. ✅
3. Nenhuma frase é genérica a ponto de servir para outra cidade sem edição. ✅
4. NR-18/ART aparece só quando o serviço justifica. ✅
5. JSON válido, no shape acima. ✅

> Se algum item falhar, regenerar. Qualidade de referência = as 27 seeds em
> `paginas-locais.json` (escritas à mão pela Maria) — use-as como exemplo de
> nível esperado.
```
