// Geração do relatório Excel "lindo" com ExcelJS.
// Retorna os bytes do arquivo .xlsx prontos para anexar no e-mail / baixar.
import ExcelJS from 'npm:exceljs@4.4.0';

export type ReportExpense = {
  occurred_at: string; // YYYY-MM-DD
  amount: number;
  note: string | null;
  category: string;
  subcategory: string;
  color: string; // hex da categoria, ex.: #0EA5A4
};

export type ReportInput = {
  periodLabel: string; // ex.: "Julho de 2026" ou "2026"
  periodKind: 'month' | 'year';
  userName: string;
  expenses: ReportExpense[];
};

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
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function thinBorder(color = BORDER) {
  const side = { style: 'thin' as const, color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

function formatDayBr(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export async function buildReportXlsx(input: ReportInput): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Meus Gastos';
  wb.created = new Date();

  const total = input.expenses.reduce((s, e) => s + e.amount, 0);
  const count = input.expenses.length;

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
  const resumo = wb.addWorksheet('Resumo', {
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
      ? `Relatório anual · ${input.periodLabel}`
      : `Relatório mensal · ${input.periodLabel}`;
  subtitle.font = { size: 13, bold: true, color: { argb: BRAND_DARK } };
  subtitle.alignment = { horizontal: 'left', indent: 1 };

  resumo.mergeCells('B5:E5');
  const who = resumo.getCell('B5');
  who.value = `Preparado para ${input.userName} · gerado em ${formatDayBr(new Date().toISOString())}`;
  who.font = { size: 10, italic: true, color: { argb: MUTED } };
  who.alignment = { horizontal: 'left', indent: 1 };

  // Cartões de destaque (Total gasto / Nº de lançamentos / Ticket médio)
  const cards: [string, number, string][] = [
    ['Total gasto', total, MONEY_FMT],
    ['Lançamentos', count, '0'],
    ['Ticket médio', count ? total / count : 0, MONEY_FMT],
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
  secTitle.value = 'Gastos por categoria';
  secTitle.font = { size: 14, bold: true, color: { argb: INK } };

  const headers = ['Categoria', 'Total', '% do total', 'Participação'];
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
  tl.value = 'TOTAL';
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
  // Aba 2 — Lançamentos (detalhe)
  // ────────────────────────────────────────────────────────────────
  const det = wb.addWorksheet('Lançamentos', { views: [{ showGridLines: false, state: 'frozen', ySplit: 1 }] });
  det.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Categoria', key: 'cat', width: 24 },
    { header: 'Subcategoria', key: 'sub', width: 22 },
    { header: 'Observação', key: 'note', width: 40 },
    { header: 'Valor', key: 'valor', width: 16 },
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
      data: formatDayBr(e.occurred_at),
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
  det.getCell(footIdx, 4).value = 'TOTAL';
  det.getCell(footIdx, 4).font = { bold: true, color: { argb: WHITE } };
  det.getCell(footIdx, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  det.getCell(footIdx, 4).alignment = { horizontal: 'right', indent: 1 };
  det.getCell(footIdx, 5).value = total;
  det.getCell(footIdx, 5).numFmt = MONEY_FMT;
  det.getCell(footIdx, 5).font = { bold: true, color: { argb: WHITE } };
  det.getCell(footIdx, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
  det.getCell(footIdx, 5).alignment = { horizontal: 'right' };

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

/** Rótulo do período em pt-BR. */
export function makePeriodLabel(kind: 'month' | 'year', year: number, month?: number): string {
  if (kind === 'year') return String(year);
  return `${MESES[(month ?? 1) - 1]} de ${year}`;
}
