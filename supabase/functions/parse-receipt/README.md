# parse-receipt

Lê a foto de uma nota fiscal e cria as **subcompras** (`expense_items`) de um
lançamento.

O app envia a foto para o bucket privado `receipts`, cria a linha em `receipts`
e chama esta função com o `receipt_id`. A função baixa a imagem com o JWT do
usuário, manda para o modelo com *saída estruturada* (JSON Schema, em
`schema.ts`) e grava o resultado via a RPC `save_receipt_parse` — que apaga e
recria os itens daquela notinha, então reprocessar a mesma foto nunca duplica
nada.

## Provedores

`reader.ts` fala com dois, escolhidos por `RECEIPT_PROVIDER`:

| Provedor | Padrão de modelo | Custo |
| --- | --- | --- |
| `gemini` (padrão) | `gemini-3.7-flash` | Free tier do Google AI Studio |
| `anthropic` | `claude-opus-5` | ~US$ 0,065 por nota |

O JSON Schema de saída é o mesmo nos dois; muda só a forma da requisição. Para
voltar ao Claude é `RECEIPT_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`, sem
tocar em código.

## Deploy

O CLI procura `supabase/functions/` a partir do diretório atual, então rode de
dentro de `meus-gastos-app`:

```bash
cd meus-gastos-app
supabase functions deploy parse-receipt
supabase secrets set GEMINI_API_KEY=...      # chave do Google AI Studio
```

## Variáveis

| Nome | Padrão | Para quê |
| --- | --- | --- |
| `GEMINI_API_KEY` | — | Obrigatória com o provedor `gemini`. |
| `ANTHROPIC_API_KEY` | — | Obrigatória com o provedor `anthropic`. |
| `RECEIPT_PROVIDER` | `gemini` | `gemini` ou `anthropic`. |
| `RECEIPT_MODEL` | conforme o provedor | Trocar de modelo sem redeploy. |
| `RECEIPTS_DAILY_LIMIT` | `40` | Notinhas por usuário por 24h. |

## Cota

Os limites do free tier do Gemini (requisições por minuto e por dia) variam por
modelo e são mostrados no painel do
[AI Studio](https://aistudio.google.com/rate-limit) — a doc pública não fixa os
números, então confira lá antes de prometer volume a alguém.

Quando a cota estoura, a API responde 429 e a função devolve *"A cota grátis de
leitura acabou por agora"*, deixando a notinha com `status = 'failed'` para o
usuário tentar de novo depois. O `RECEIPTS_DAILY_LIMIT` é o freio de mão da
aplicação: existe para um único usuário não consumir a cota do projeto inteiro
(e, no provedor pago, para uma conta comprometida não virar uma fatura).

## Privacidade

A foto do cupom sai do seu Supabase e vai para o provedor escolhido. Cupom
brasileiro costuma trazer CNPJ do estabelecimento e, quando o cliente pede,
CPF na nota. Isso está declarado na política de privacidade do app
(`src/legal/content.ts`) — se trocar de provedor, atualize lá também.

## Teste manual

```bash
curl -X POST "$SUPABASE_URL/functions/v1/parse-receipt" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"receipt_id":"<uuid>"}'
```

## Resposta

```jsonc
{
  "ok": true,
  "receipt": { "status": "done", "merchant": "Hortifruti Central", "total": 87.4, ... },
  "items": [ { "description": "Banana prata", "quantity": 1.24, "unit": "kg", "total": 7.31 }, ... ],
  "itemsTotal": 87.4,
  "mismatch": false   // true = a soma dos itens não fecha com o total impresso
}
```

`mismatch` não bloqueia nada: a tela mostra o aviso e o usuário corrige o que
o OCR errou. Foto amassada, dobrada ou com brilho é o caso comum.

Em caso de erro, a linha em `receipts` fica com `status = 'failed'` e a
mensagem em `error` — é o que a tela usa para oferecer "tentar de novo".
