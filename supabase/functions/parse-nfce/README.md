# parse-nfce

Lê o **QR Code** do cupom fiscal e traz os itens direto do portal da SEFAZ.

É o caminho preferido da notinha: os itens vêm exatos (não é OCR, é o que o
emissor declarou), não custa nada e nenhuma imagem sai do aparelho. O leitor
por foto (`parse-receipt`) continua existindo para o que não tem QR — feira,
padaria, recibo, cupom velho — e como saída quando este aqui falha.

## Como funciona

1. O app lê o QR e grava a linha em `receipts` com `source = 'qrcode'` e a URL
   em `qr_url`.
2. Esta função extrai a **chave de acesso** (44 dígitos) do parâmetro `p=`,
   confere o dígito verificador (módulo 11) e só então vai à rede.
3. Busca a própria URL do QR — que já aponta para o portal da UF certa, então
   não existe tabela de endereço por estado para manter.
4. Interpreta o HTML e grava pela mesma RPC `save_receipt_parse` usada pela
   leitura por foto.

## Duas travas que não são opcionais

**SSRF.** A função só busca `https://` em host que termine em `.gov.br`, e
recusa IP literal e `localhost`. Sem isso, qualquer pessoa autenticada mandaria
o servidor buscar qualquer endereço da internet — inclusive endpoints internos
da infraestrutura.

**Chave inválida.** O dígito verificador é conferido antes do `fetch`. QR
amassado ou lido errado morre aqui, sem gastar viagem à SEFAZ.

## Estados

O layout de referência do ENCAT (tabela `#tabResult`) cobre a maioria das UFs.
Quem fugiu dele cai no leitor genérico, que procura o desenho
"descrição … Qtde … Vl. Unit … total" em qualquer tabela.

Quando os dois falham, a resposta é 422 com uma mensagem que manda fotografar a
nota — e o log do servidor registra a UF e o tamanho da página. **O corpo da
página nunca é logado:** cupom com "CPF na nota" traz o CPF do consumidor.

Para ensinar um estado novo, o lugar é `scrape.ts`: acrescente um leitor antes
do genérico e cubra com um caso em `scrape_test.ts`.

## Testes

```bash
cd supabase/functions/parse-nfce
deno run scrape_test.ts
```

Cobre o layout de referência, o leitor genérico, extração e validação da chave,
e as recusas do filtro de portal (http, domínio de fora, IP).

## Deploy

```bash
cd meus-gastos-app
supabase functions deploy parse-nfce
```

Não precisa de segredo: a consulta é pública. `NFCE_DAILY_LIMIT` (padrão 200)
limita notinhas por usuário por 24h — a consulta é grátis, mas isso impede que
a função vire proxy de raspagem de terceiros.

## Resposta

```jsonc
{
  "ok": true,
  "receipt": { "status": "done", "merchant": "SUPERMERCADO ...", "access_key": "4126...", ... },
  "items": [ { "description": "BANANA PRATA KG", "quantity": 1.24, "unit": "kg", "total": 7.30 }, ... ],
  "itemsTotal": 22.27,
  "mismatch": false,
  "duplicate": null   // id do gasto que já usou esta mesma nota fiscal
}
```

`duplicate` sai preenchido quando a mesma chave de acesso já virou gasto. Não
bloqueia: a tela avisa e deixa a pessoa decidir.
