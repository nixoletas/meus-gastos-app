// Geração do relatório Excel "lindo" com ExcelJS.
// Retorna os bytes do arquivo .xlsx prontos para anexar no e-mail / baixar.
import ExcelJS from 'npm:exceljs@4.4.0';
import { Lang, t } from '../_shared/i18n.ts';

export type ReportExpense = {
  occurred_at: string; // YYYY-MM-DD
  amount: number;
  note: string | null;
  category: string;
  subcategory: string;
  color: string; // hex da categoria, ex.: #0EA5A4
};

/** Uma subcompra da notinha, já com os dados do gasto-pai resolvidos. */
export type ReportItem = {
  occurred_at: string; // YYYY-MM-DD (data do lançamento)
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total: number;
  merchant: string;
  category: string;
};

export type ReportInput = {
  periodLabel: string; // ex.: "Julho de 2026" ou "2026"
  periodKind: 'month' | 'year';
  lang: Lang;
  userName: string;
  expenses: ReportExpense[];
  /** Itens lidos das notinhas. Vazio quando ninguém anexou nota no período. */
  items?: ReportItem[];
};

/**
 * Ranking de produtos: junta pelo texto normalizado, porque "Leite integral" e
 * "LEITE INTEGRAL" são a mesma compra para quem lê o relatório.
 */
function rankItems(items: ReportItem[]) {
  const buckets = new Map<string, { name: string; total: number; count: number }>();
  for (const item of items) {
    const key = item.description.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) continue;
    const bucket = buckets.get(key) ?? { name: item.description.trim(), total: 0, count: 0 };
    bucket.total += item.total;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.total - a.total);
}

// Paleta da marca (mesma do app).
const BRAND = 'FF0EA5A4';
const BRAND_DARK = 'FF0B7C7B';
const INK = 'FF0F172A';
const MUTED = 'FF64748B';
const SOFT = 'FFF1FAF9';
const ZEBRA = 'FFF7FAFB';
const WHITE = 'FFFFFFFF';
const BORDER = 'FFE2E8F0';

const MONEY_FMT = '"R$" #,##0.00';
const PCT_FMT = '0.0"%"';
function thinBorder(color = BORDER) {
  const side = { style: 'thin' as const, color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

/** Data por extenso curta: 24/08/2026 em pt-BR, 08/24/2026 em inglês. */
function formatDay(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const dia = String(d).padStart(2, '0');
  const mes = String(m).padStart(2, '0');
  return lang === 'en' ? `${mes}/${dia}/${y}` : `${dia}/${mes}/${y}`;
}

export async function buildReportXlsx(input: ReportInput): Promise<Uint8Array> {
  const dict = t(input.lang).report;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Meus Gastos';
  wb.created = new Date();

  const total = input.expenses.reduce((s, e) => s + e.amount, 0);
  const count = input.expenses.length;
  const items = input.items ?? [];
  const topItens = rankItems(items).slice(0, 10);
  const itensTotal = items.reduce((s, i) => s + i.total, 0);

  // Agrupa por categoria.
  const byCat = new Map<string, { total: number; count: number; color: string }>();
  for (const e of input.expenses) {
    const cur = byCat.get(e.category) ?? { total: 0, count: 0, color: e.color };
    cur.total += e.amount;
    cur.count += 1;
    byCat.set(e.category, cur);
  }
  const catRows = [...byCat.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total);

  // ────────────────────────────────────────────────────────────────
  // Aba 1 — Resumo
  // ────────────────────────────────────────────────────────────────
  const resumo = wb.addWorksheet(dict.sheetSummary, {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 20 },
  });
  resumo.columns = [
    { width: 3 },
    { width: 34 },
    { width: 18 },
    { width: 12 },
    { width: 26 },
    { width: 3 },
  ];

  // Faixa de título
  resumo.mergeCells('B2:E3');
  const titleCell = resumo.getCell('B2');
  titleCell.value = 'Meus Gastos';
  titleCell.font = { name: 'Calibri', size: 26, bold: true, color: { argb: WHITE } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  for (const row of [2, 3]) {
    for (const col of ['B', 'C', 'D', 'E']) {
      resumo.getCell(`${col}${row}`).fill = {
        type: 'gradient',
        gradient: 'angle',
        degree: 0,
        stops: [
          { position: 0, color: { argb: BRAND } },
          { position: 1, color: { argb: BRAND_DARK } },
        ],
      } as ExcelJS.Fill;
    }
  }

  resumo.mergeCells('B4:E4');
  const subtitle = resumo.getCell('B4');
  subtitle.value =
    input.periodKind === 'year'
      ? dict.subtitleYear(input.periodLabel)
      : dict.subtitleMonth(input.periodLabel);
  subtitle.font = { size: 13, bold: true, color: { argb: BRAND_DARK } };
  subtitle.alignment = { horizontal: 'left', indent: 1 };

  resumo.mergeCells('B5:E5');
  const who = resumo.getCell('B5');
  who.value = dict.preparedFor(
    input.userName,
    formatDay(new Date().toISOString(), input.lang)
  );
  who.font = { size: 10, italic: true, color: { argb: MUTED } };
  who.alignment = { horizontal: 'left', indent: 1 };

  // Cartões de destaque (Total gasto / Nº de lançamentos / Ticket médio)
  const cards: [string, number, string][] = [
    [dict.cardTotal, total, MONEY_FMT],
    [dict.cardCount, count, '0'],
    [dict.cardAverage, count ? total / count : 0, MONEY_FMT],
  ];
  let cardCol = 2; // B
  const cardRowLabel = 7;
  const cardRowValue = 8;
  for (const [label, value, fmt] of cards) {
    const colLetter = String.fromCharCode(64 + cardCol);
    const lc = resumo.getCell(`${colLetter}${cardRowLabel}`);
    lc.value = label.toUpperCase();
    lc.font = { size: 9, bold: true, color: { argb: MUTED } };
    lc.alignment = { horizontal: 'left', indent: 1 };
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
    lc.border = { top: thinBorder().top, left: thinBorder().left, right: thinBorder().right };

    const vc = resumo.getCell(`${colLetter}${cardRowValue}`);
    vc.value = value;
    vc.numFmt = fmt;
    vc.font = { size: 18, bold: true, color: { argb: BRAND_DARK } };
    vc.alignment = { horizontal: 'left', indent: 1 };
    vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
    vc.border = { bottom: thinBorder().bottom, left: thinBorder().left, right: thinBorder().right };
    resumo.getRow(cardRowValue).height = 26;
    cardCol += 1;
  }

  // Tabela "Gastos por categoria"
  const headerRowIdx = 11;
  resumo.mergeCells(`B${headerRowIdx - 1}:E${headerRowIdx - 1}`);
  const secTitle = resumo.getCell(`B${headerRowIdx - 1}`);
  secTitle.value = dict.byCategory;
  secTitle.font = { size: 14, bold: true, color: { argb: INK } };

  const headers = [dict.colCategory, dict.colTotal, dict.colPercent, dict.colShare];
  headers.forEach((h, i) => {
    const cell = resumo.getCell(headerRowIdx, 2 + i);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
    cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
    cell.border = thinBorder(BRAND);
  });
  resumo.getRow(headerRowIdx).height = 22;

  catRows.forEach((c, i) => {
    const r = headerRowIdx + 1 + i;
    const pct = total ? c.total / total : 0;
    const zebra = i % 2 === 1;

    const nameCell = resumo.getCell(r, 2);
    nameCell.value = c.name;
    nameCell.font = { color: { argb: INK }, bold: true };
    nameCell.alignment = { horizontal: 'left', indent: 1 };

    const totCell = resumo.getCell(r, 3);
    totCell.value = c.total;
    totCell.numFmt = MONEY_FMT;
    totCell.alignment = { horizontal: 'right' };
    totCell.font = { color: { argb: INK } };

    const pctCell = resumo.getCell(r, 4);
    pctCell.value = pct * 100;
    pctCell.numFmt = PCT_FMT;
    pctCell.alignment = { horizontal: 'center' };
    pctCell.font = { color: { argb: MUTED } };

    // Mini "barra" com blocos █, proporcional ao percentual.
    const barCell = resumo.getCell(r, 5);
    const blocks = Math.max(pct > 0 ? 1 : 0, Math.round(pct * 20));
    barCell.value = '█'.repeat(blocks);
    const argb = 'FF' + (c.color?.replace('#', '') || '0EA5A4').toUpperCase();
    barCell.font = { color: { argb } };
    barCell.alignment = { horizontal: 'left' };

    for (let col = 2; col <= 5; col++) {
      const cell = resumo.getCell(r, col);
      cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
    }
  });

  // Linha de total
  const totalRow = headerRowIdx + 1 + catRows.length;
  const tl = resumo.getCell(totalRow, 2);
  tl.value = dict.totalRow;
  tl.font = { bold: true, color: { argb: WHITE } };
  tl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  tl.alignment = { horizontal: 'left', indent: 1 };
  const tv = resumo.getCell(totalRow, 3);
  tv.value = total;
  tv.numFmt = MONEY_FMT;
  tv.font = { bold: true, color: { argb: WHITE } };
  tv.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  tv.alignment = { horizontal: 'right' };
  for (const col of [4, 5]) {
    resumo.getCell(totalRow, col).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK },
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Resumo — top produtos (só quando houve notinha no período)
  // ────────────────────────────────────────────────────────────────
  if (topItens.length > 0) {
    const inicio = totalRow + 3;
    resumo.mergeCells(`B${inicio}:E${inicio}`);
    const tituloItens = resumo.getCell(`B${inicio}`);
    tituloItens.value = dict.topProducts;
    tituloItens.font = { size: 14, bold: true, color: { argb: INK } };

    const cabecalho = [dict.colProduct, dict.colTotal, dict.colTimes, ''];
    cabecalho.forEach((h, i) => {
      const cell = resumo.getCell(inicio + 1, 2 + i);
      cell.value = h;
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
      cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 };
      cell.border = thinBorder(BRAND);
    });

    const maior = topItens[0].total;
    topItens.forEach((item, i) => {
      const r = inicio + 2 + i;
      const zebra = i % 2 === 1;

      const nome = resumo.getCell(r, 2);
      nome.value = item.name;
      nome.font = { color: { argb: INK }, bold: true };
      nome.alignment = { horizontal: 'left', indent: 1 };

      const valor = resumo.getCell(r, 3);
      valor.value = item.total;
      valor.numFmt = MONEY_FMT;
      valor.alignment = { horizontal: 'right' };

      const vezes = resumo.getCell(r, 4);
      vezes.value = item.count;
      vezes.alignment = { horizontal: 'center' };
      vezes.font = { color: { argb: MUTED } };

      // Mesma barra de blocos da tabela de categorias, para comparar de relance.
      const barra = resumo.getCell(r, 5);
      barra.value = '█'.repeat(Math.max(1, Math.round((item.total / maior) * 20)));
      barra.font = { color: { argb: BRAND } };
      barra.alignment = { horizontal: 'left' };

      for (let col = 2; col <= 5; col++) {
        const cell = resumo.getCell(r, col);
        cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
        if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Aba 2 — Lançamentos (detalhe)
  // ────────────────────────────────────────────────────────────────
  const det = wb.addWorksheet(dict.sheetEntries, {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 1 }],
  });
  det.columns = [
    { header: dict.colDate, key: 'data', width: 14 },
    { header: dict.colCategory, key: 'cat', width: 24 },
    { header: dict.colSubcategory, key: 'sub', width: 22 },
    { header: dict.colNote, key: 'note', width: 40 },
    { header: dict.colAmount, key: 'valor', width: 16 },
  ];
  const detHeader = det.getRow(1);
  detHeader.height = 24;
  detHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = thinBorder(BRAND);
  });

  const sorted = [...input.expenses].sort((a, b) =>
    a.occurred_at === b.occurred_at ? 0 : a.occurred_at < b.occurred_at ? 1 : -1
  );
  sorted.forEach((e, i) => {
    const row = det.addRow({
      data: formatDay(e.occurred_at, input.lang),
      cat: e.category,
      sub: e.subcategory,
      note: e.note ?? '',
      valor: e.amount,
    });
    row.getCell('valor').numFmt = MONEY_FMT;
    row.eachCell((cell, col) => {
      cell.alignment = { horizontal: col === 5 ? 'right' : 'left', indent: col === 5 ? 0 : 1, vertical: 'middle' };
      cell.font = { color: { argb: INK } };
      cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
      if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
    });
    row.height = 19;
  });

  // Rodapé com total na aba de detalhe.
  const footIdx = det.rowCount + 1;
  det.getCell(footIdx, 4).value = dict.totalRow;
  det.getCell(footIdx, 4).font = { bold: true, color: { argb: WHITE } };
  det.getCell(footIdx, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  det.getCell(footIdx, 4).alignment = { horizontal: 'right', indent: 1 };
  det.getCell(footIdx, 5).value = total;
  det.getCell(footIdx, 5).numFmt = MONEY_FMT;
  det.getCell(footIdx, 5).font = { bold: true, color: { argb: WHITE } };
  det.getCell(footIdx, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  det.getCell(footIdx, 5).alignment = { horizontal: 'right' };

  // ────────────────────────────────────────────────────────────────
  // Aba 3 — Itens (o que veio das notinhas)
  //
  // Só existe quando houve notinha no período: planilha vazia confunde mais
  // do que ajuda. O total daqui é menor que o do relatório de propósito — nem
  // todo gasto tem nota anexada.
  // ────────────────────────────────────────────────────────────────
  if (items.length > 0) {
    const aba = wb.addWorksheet(dict.sheetItems, {
      views: [{ showGridLines: false, state: 'frozen', ySplit: 1 }],
    });
    aba.columns = [
      { header: dict.colDate, key: 'data', width: 14 },
      { header: dict.colMerchant, key: 'mercado', width: 28 },
      { header: dict.colItem, key: 'item', width: 38 },
      { header: dict.colQty, key: 'qtd', width: 10 },
      { header: dict.colUnit, key: 'un', width: 8 },
      { header: dict.colUnitPrice, key: 'unit', width: 14 },
      { header: dict.colTotal, key: 'total', width: 14 },
      { header: dict.colCategory, key: 'cat', width: 22 },
    ];

    const cabecalho = aba.getRow(1);
    cabecalho.height = 24;
    cabecalho.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = thinBorder(BRAND);
    });

    const ordenados = [...items].sort((a, b) =>
      a.occurred_at === b.occurred_at ? 0 : a.occurred_at < b.occurred_at ? 1 : -1
    );

    ordenados.forEach((item, i) => {
      const row = aba.addRow({
        data: item.occurred_at ? formatDay(item.occurred_at, input.lang) : '',
        mercado: item.merchant,
        item: item.description,
        qtd: item.quantity,
        un: item.unit ?? '',
        unit: item.unit_price ?? '',
        total: item.total,
        cat: item.category,
      });
      row.getCell('unit').numFmt = MONEY_FMT;
      row.getCell('total').numFmt = MONEY_FMT;
      row.eachCell((cell, col) => {
        const direita = col === 6 || col === 7;
        cell.alignment = {
          horizontal: direita ? 'right' : col === 4 || col === 5 ? 'center' : 'left',
          indent: direita ? 0 : 1,
          vertical: 'middle',
        };
        cell.font = { color: { argb: INK } };
        cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
        if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
      });
      row.height = 19;
    });

    const rodape = aba.rowCount + 1;
    aba.getCell(rodape, 6).value = dict.itemsTotalRow;
    aba.getCell(rodape, 7).value = itensTotal;
    aba.getCell(rodape, 7).numFmt = MONEY_FMT;
    for (const col of [6, 7]) {
      const cell = aba.getCell(rodape, col);
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
      cell.alignment = { horizontal: 'right', indent: col === 6 ? 1 : 0 };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

/** Rótulo do período no idioma pedido. */
export function makePeriodLabel(
  kind: 'month' | 'year',
  year: number,
  month: number | undefined,
  lang: Lang
): string {
  if (kind === 'year') return String(year);
  const dict = t(lang).report;
  return dict.periodLabel(dict.months[(month ?? 1) - 1], year);
}
