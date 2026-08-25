// Schema de saida e prompt do leitor de notinhas por foto.
//
// A extracao usa "structured outputs": o modelo e obrigado a devolver um JSON
// que casa com o schema abaixo, entao nao precisamos tratar texto solto nem
// pedir "responda so JSON" e torcer. Os tipos e a normalizacao do resultado
// moram em ../_shared/receipt.ts, compartilhados com o leitor de QR Code.

export const RECEIPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'merchant',
    'merchant_doc',
    'issued_at',
    'payment_method',
    'subtotal',
    'discount',
    'total',
    'access_key',
    'items',
  ],
  properties: {
    merchant: {
      type: ['string', 'null'],
      description: 'Nome fantasia do estabelecimento, como aparece no topo da nota.',
    },
    merchant_doc: {
      type: ['string', 'null'],
      description: 'CNPJ do estabelecimento, apenas dígitos.',
    },
    issued_at: {
      type: ['string', 'null'],
      description:
        'Data e hora de emissão em ISO 8601 (ex.: 2026-08-24T19:32:00). Sem fuso, é horário de Brasília.',
    },
    payment_method: {
      type: ['string', 'null'],
      enum: ['credito', 'debito', 'pix', 'dinheiro', 'vale', 'outro', null],
      description: 'Forma de pagamento impressa na nota.',
    },
    subtotal: { type: ['number', 'null'], description: 'Soma dos itens antes de desconto.' },
    discount: { type: ['number', 'null'], description: 'Desconto total, positivo.' },
    total: { type: ['number', 'null'], description: 'Valor total pago, o que está em "TOTAL".' },
    access_key: {
      type: ['string', 'null'],
      description: 'Chave de acesso da NFC-e/NF-e, 44 dígitos, se estiver impressa.',
    },
    items: {
      type: 'array',
      description: 'Uma entrada por linha de produto da nota, na ordem impressa.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['description', 'raw_text', 'quantity', 'unit', 'unit_price', 'total'],
        properties: {
          description: {
            type: 'string',
            description:
              'Nome legível do produto, com abreviações expandidas. Ex.: "LEITE INT ITBA 1L" vira "Leite integral Itambé 1L".',
          },
          raw_text: {
            type: ['string', 'null'],
            description: 'A descrição exatamente como está impressa, sem correções.',
          },
          quantity: { type: ['number', 'null'], description: 'Quantidade. 1 quando não houver.' },
          unit: {
            type: ['string', 'null'],
            description: 'Unidade: un, kg, g, l, ml, cx, pct.',
          },
          unit_price: { type: ['number', 'null'], description: 'Preço unitário.' },
          total: { type: 'number', description: 'Valor total da linha, já com quantidade.' },
        },
      },
    },
  },
};

export const SYSTEM_PROMPT = [
  'Você lê cupons fiscais e recibos brasileiros (NFC-e, NF-e, cupom não fiscal, recibo de feira).',
  '',
  'Regras:',
  '- Extraia EXATAMENTE o que está impresso. Nunca invente um item que não aparece na imagem.',
  '- Valores em reais, com ponto decimal (12.90, não 12,90).',
  '- Em `description`, expanda as abreviações do mercado para um nome que uma pessoa entenda,',
  '  e guarde o texto original, sem correção, em `raw_text`.',
  '- Ignore linhas que não são produto: subtotal, total, troco, desconto, tributos, CPF na nota,',
  '  endereço, número do cupom, mensagens de propaganda.',
  '- Desconto de item já embutido na linha fica no `total` da linha. Desconto geral vai em `discount`.',
  '- Item pesado (kg) costuma ter quantidade fracionada: use `quantity` 0.784 e `unit` "kg".',
  '- Se um campo não estiver visível ou legível na imagem, devolva null. Não chute.',
  '- Se a imagem não for uma nota/recibo, devolva `items` vazio e todos os campos null.',
].join('\n');

export const USER_PROMPT =
  'Extraia todos os itens e os dados desta nota. Se a foto estiver cortada, extraia só o que dá para ler.';

