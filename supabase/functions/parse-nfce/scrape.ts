// Leitura da página de consulta da NFC-e.
//
// A maioria das UFs publica a "consulta completa" no layout de referência do
// ENCAT (tabela `#tabResult`, uma linha por item, com as classes `txtTit`,
// `Rqtd`, `RUN`, `RvlUnit` e `valor`). Quem fugiu desse layout cai no leitor
// genérico, que trabalha em cima do texto puro da página.
//
// Quando nada dá certo, o chamador manda o usuário fotografar a nota — o
// caminho da foto continua existindo justamente para isso.
import { parse } from 'npm:node-html-parser@6';
import { ParsedItem, ParsedReceipt } from '../_shared/receipt.ts';

/** "1.234,56" e "12,90" viram número; "" vira null. */
function moeda(texto: string | null | undefined): number | null {
  if (!texto) return null;
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const valor = Number.parseFloat(limpo);
  return Number.isFinite(valor) ? valor : null;
}

/** Tira rótulo ("Qtde.:", "Vl. Unit.:") e espaço duplicado. */
function limpo(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').replace(/^[^:]*:\s*/, '').trim();
}

function texto(node: { textContent?: string } | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const PAGAMENTO: [RegExp, string][] = [
  [/cr[ée]dito/i, 'credito'],
  [/d[ée]bito/i, 'debito'],
  [/pix/i, 'pix'],
  [/dinheiro/i, 'dinheiro'],
  [/vale|alimenta|refei/i, 'vale'],
];

function formaDePagamento(paginaEmTexto: string): string | null {
  const trecho = paginaEmTexto.match(/forma[s]? de pagamento(.{0,120})/i)?.[1];
  const alvo = trecho ?? paginaEmTexto;
  for (const [regex, valor] of PAGAMENTO) {
    if (regex.test(alvo)) return valor;
  }
  return null;
}

/** "Emissão: 24/08/2026 19:32:05" -> ISO. */
function emissao(paginaEmTexto: string): string | null {
  const achado = paginaEmTexto.match(
    /emiss[ãa]o[:\s]*(\d{2})\/(\d{2})\/(\d{4})(?:[\s-]*(\d{2}):(\d{2})(?::(\d{2}))?)?/i
  );
  if (!achado) return null;
  const [, dia, mes, ano, hora = '12', minuto = '00', segundo = '00'] = achado;
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function cnpjDaPagina(paginaEmTexto: string): string | null {
  const achado = paginaEmTexto.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
  return achado ? achado[1].replace(/\D/g, '') : null;
}

/** Total pago: o rótulo muda de UF para UF, então tentamos os mais comuns. */
function totalDaPagina(paginaEmTexto: string): number | null {
  const rotulos = [
    /valor a pagar r?\$?\s*([\d.,]+)/i,
    /valor total r?\$?\s*([\d.,]+)/i,
    /total a pagar r?\$?\s*([\d.,]+)/i,
    /valor pago r?\$?\s*([\d.,]+)/i,
  ];
  for (const regex of rotulos) {
    const achado = paginaEmTexto.match(regex);
    const valor = moeda(achado?.[1]);
    if (valor !== null) return valor;
  }
  return null;
}

function descontoDaPagina(paginaEmTexto: string): number | null {
  const achado = paginaEmTexto.match(/desconto[s]?\s*r?\$?\s*([\d.,]+)/i);
  return moeda(achado?.[1]);
}

/** Layout de referência do ENCAT: `#tabResult` com uma linha por item. */
function itensDaTabela(root: ReturnType<typeof parse>): ParsedItem[] {
  const itens: ParsedItem[] = [];

  for (const linha of root.querySelectorAll('#tabResult tr')) {
    const descricao = texto(linha.querySelector('.txtTit'));
    const total = moeda(texto(linha.querySelector('.valor')));
    if (!descricao || total === null) continue;

    const quantidade = Number.parseFloat(
      limpo(texto(linha.querySelector('.Rqtd'))).replace(/\./g, '').replace(',', '.')
    );
    const unidade = limpo(texto(linha.querySelector('.RUN'))).toLowerCase();
    const unitario = moeda(limpo(texto(linha.querySelector('.RvlUnit'))));

    itens.push({
      description: descricao,
      raw_text: descricao,
      quantity: Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1,
      unit: unidade || null,
      unit_price: unitario,
      total,
    });
  }

  return itens;
}

/**
 * Leitor genérico: varre as linhas de qualquer tabela procurando o desenho
 * "descrição … Qtde … Vl. Unit … total", que é o que todo cupom mostra mesmo
 * quando o HTML é diferente.
 */
function itensGenericos(root: ReturnType<typeof parse>): ParsedItem[] {
  const itens: ParsedItem[] = [];

  for (const linha of root.querySelectorAll('tr')) {
    const conteudo = texto(linha);
    if (!/qtde|qtd\b|quantidade/i.test(conteudo)) continue;
    if (!/vl\.?\s*unit|valor unit/i.test(conteudo)) continue;

    const quantidade = Number.parseFloat(
      (conteudo.match(/(?:qtde|qtd|quantidade)\.?:?\s*([\d.,]+)/i)?.[1] ?? '1')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    const unitario = moeda(conteudo.match(/(?:vl\.?\s*unit|valor unit)[^\d]*([\d.,]+)/i)?.[1]);
    const unidade = conteudo.match(/un:?\s*([a-zA-Z]{1,4})/i)?.[1]?.toLowerCase() ?? null;

    // A descrição é o que vem antes do primeiro rótulo.
    const descricao = conteudo.split(/\(?c[óo]digo|qtde|qtd\b|quantidade/i)[0].trim();

    // O total costuma ser o último valor monetário da linha.
    const valores = conteudo.match(/[\d.]+,\d{2}/g) ?? [];
    const total = moeda(valores[valores.length - 1]);

    if (!descricao || total === null) continue;

    itens.push({
      description: descricao,
      raw_text: descricao,
      quantity: Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1,
      unit: unidade,
      unit_price: unitario,
      total,
    });
  }

  return itens;
}

/** Converte a página da SEFAZ no mesmo formato que sai da leitura por foto. */
export function lerPaginaNfce(html: string): ParsedReceipt {
  const root = parse(html);

  // Script e style sujariam a varredura por texto.
  for (const lixo of root.querySelectorAll('script, style')) lixo.remove();
  const paginaEmTexto = texto(root);

  const itens = itensDaTabela(root);
  const finais = itens.length > 0 ? itens : itensGenericos(root);

  const merchant =
    texto(root.querySelector('.txtTopo')) ||
    texto(root.querySelector('#u20')) ||
    null;

  return {
    merchant: merchant || null,
    merchant_doc: cnpjDaPagina(paginaEmTexto),
    issued_at: emissao(paginaEmTexto),
    payment_method: formaDePagamento(paginaEmTexto),
    subtotal: null,
    discount: descontoDaPagina(paginaEmTexto),
    total: totalDaPagina(paginaEmTexto),
    access_key: null, // quem manda é a chave do QR, preenchida pelo chamador
    items: finais,
  };
}
