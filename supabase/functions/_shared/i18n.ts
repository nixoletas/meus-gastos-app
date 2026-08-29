/**
 * Textos das Edge Functions em português e inglês.
 *
 * As funções devolvem mensagens prontas para o usuário ler na tela ("tire
 * outra foto"), e o relatório em Excel sai com cabeçalhos e e-mail. Por isso
 * o cliente manda `lang` no corpo da requisição; sem ele, cai em pt-BR.
 */
export type Lang = 'pt-BR' | 'en';

/** Normaliza o que veio do cliente ("en-US", "pt", undefined) para um Lang. */
export function pickLang(value: unknown): Lang {
  const tag = typeof value === 'string' ? value.toLowerCase() : '';
  return tag.startsWith('en') ? 'en' : 'pt-BR';
}

const pt = {
  http: {
    methodNotAllowed: 'Método não permitido',
    notAuthenticated: 'Não autenticado',
    invalidSession: 'Sessão inválida',
    unexpected: 'Erro inesperado',
    receiptIdRequired: 'receipt_id é obrigatório',
    receiptNotFound: 'Notinha não encontrada',
    noEmail: 'Usuário sem e-mail cadastrado',
  },

  report: {
    months: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ],
    periodLabel: (month: string, year: number) => `${month} de ${year}`,
    /** Nome do arquivo continua estável nos dois idiomas. */
    sheetSummary: 'Resumo',
    sheetEntries: 'Lançamentos',
    sheetItems: 'Itens',
    subtitleYear: (period: string) => `Relatório anual · ${period}`,
    subtitleMonth: (period: string) => `Relatório mensal · ${period}`,
    preparedFor: (name: string, date: string) => `Preparado para ${name} · gerado em ${date}`,
    cardTotal: 'Total gasto',
    cardCount: 'Lançamentos',
    cardAverage: 'Ticket médio',
    byCategory: 'Gastos por categoria',
    colCategory: 'Categoria',
    colTotal: 'Total',
    colPercent: '% do total',
    colShare: 'Participação',
    totalRow: 'TOTAL',
    topProducts: 'Top produtos (pelas notinhas)',
    colProduct: 'Produto',
    colTimes: 'Vezes',
    colDate: 'Data',
    colSubcategory: 'Subcategoria',
    colNote: 'Observação',
    colAmount: 'Valor',
    colMerchant: 'Estabelecimento',
    colItem: 'Item',
    colQty: 'Qtd.',
    colUnit: 'Un.',
    colUnitPrice: 'Vl. unit.',
    itemsTotalRow: 'TOTAL EM ITENS',
    noCategory: 'Sem categoria',
    youFallback: 'você',
  },

  email: {
    kindYear: 'anual',
    kindMonth: 'mensal',
    header: (kind: string, period: string) => `Relatório ${kind} · ${period}`,
    hi: (name: string) => `Oi, ${name}! 👋`,
    body: (what: string) =>
      `Seu relatório de gastos está pronto. Os detalhes completos estão na planilha Excel em anexo — dá uma olhada em como foi ${what}. 📊`,
    theYear: 'o ano',
    theMonth: 'o mês',
    totalSpent: 'Total gasto',
    entries: 'Lançamentos',
    footer: 'Enviado automaticamente pelo Meus Gastos · feito no Brasil 🇧🇷',
    subject: (kind: string, period: string) => `📊 Seu relatório ${kind} — ${period}`,
    locale: 'pt-BR',
  },

  receipt: {
    missingKey: (envVar: string) =>
      `Leitura de notinha não está configurada no servidor (falta ${envVar}).`,
    dailyLimit: (limit: number) =>
      `Você já leu ${limit} notinhas nas últimas 24 horas. Tente de novo amanhã.`,
    cantOpenPhoto: 'Não consegui abrir a foto da notinha.',
    emptyPhoto: 'A foto chegou vazia. Tente enviar de novo.',
    photoTooBig: 'A foto está grande demais. Tire outra com menos zoom.',
    noItems: 'Não achei nenhum item nessa foto. Confira se a nota está inteira e legível.',
    quotaOver: 'A cota grátis de leitura acabou por agora. Tente de novo mais tarde.',
    keyRefused: 'A chave da leitura de notinha foi recusada.',
    readFailed: 'A leitura da notinha falhou. Tente de novo.',
    emptyRead: 'A leitura voltou vazia. Tente de novo.',
    cantReadImage: 'Não consegui ler essa imagem. Tente outra foto.',
  },

  nfce: {
    noQr: 'Essa notinha não tem QR Code.',
    notSefaz: 'Esse QR Code não aponta para um portal da SEFAZ.',
    badKey: 'Não reconheci a chave dessa nota. Tente ler o QR de novo.',
    dailyLimit: 'Muitas notinhas nas últimas 24 horas. Tente amanhã.',
    unknownLayout:
      'Consegui abrir a nota, mas não entendi a lista de itens desse estado. Fotografe a nota que eu leio pela imagem.',
    timeout: 'O portal da SEFAZ demorou demais para responder. Tente de novo.',
    failed: 'Não consegui consultar essa nota. Fotografe a notinha que eu leio pela imagem.',
  },
};

export type Dict = typeof pt;

const en: Dict = {
  http: {
    methodNotAllowed: 'Method not allowed',
    notAuthenticated: 'Not authenticated',
    invalidSession: 'Invalid session',
    unexpected: 'Unexpected error',
    receiptIdRequired: 'receipt_id is required',
    receiptNotFound: 'Receipt not found',
    noEmail: 'This user has no email address',
  },

  report: {
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    periodLabel: (month: string, year: number) => `${month} ${year}`,
    sheetSummary: 'Summary',
    sheetEntries: 'Entries',
    sheetItems: 'Items',
    subtitleYear: (period: string) => `Yearly report · ${period}`,
    subtitleMonth: (period: string) => `Monthly report · ${period}`,
    preparedFor: (name: string, date: string) => `Prepared for ${name} · generated on ${date}`,
    cardTotal: 'Total spent',
    cardCount: 'Entries',
    cardAverage: 'Average entry',
    byCategory: 'Spending by category',
    colCategory: 'Category',
    colTotal: 'Total',
    colPercent: '% of total',
    colShare: 'Share',
    totalRow: 'TOTAL',
    topProducts: 'Top products (from receipts)',
    colProduct: 'Product',
    colTimes: 'Times',
    colDate: 'Date',
    colSubcategory: 'Subcategory',
    colNote: 'Note',
    colAmount: 'Amount',
    colMerchant: 'Merchant',
    colItem: 'Item',
    colQty: 'Qty',
    colUnit: 'Unit',
    colUnitPrice: 'Unit price',
    itemsTotalRow: 'ITEMS TOTAL',
    noCategory: 'No category',
    youFallback: 'friend',
  },

  email: {
    kindYear: 'yearly',
    kindMonth: 'monthly',
    header: (kind: string, period: string) => `${kind} report · ${period}`,
    hi: (name: string) => `Hi, ${name}! 👋`,
    body: (what: string) =>
      `Your expense report is ready. The full details are in the attached Excel file — take a look at how ${what} went. 📊`,
    theYear: 'the year',
    theMonth: 'the month',
    totalSpent: 'Total spent',
    entries: 'Entries',
    footer: 'Sent automatically by Meus Gastos · made in Brazil 🇧🇷',
    subject: (kind: string, period: string) => `📊 Your ${kind} report — ${period}`,
    locale: 'en-US',
  },

  receipt: {
    missingKey: (envVar: string) =>
      `Receipt reading is not configured on the server (${envVar} is missing).`,
    dailyLimit: (limit: number) =>
      `You have already read ${limit} receipts in the last 24 hours. Try again tomorrow.`,
    cantOpenPhoto: 'I could not open the receipt photo.',
    emptyPhoto: 'The photo came through empty. Try sending it again.',
    photoTooBig: 'The photo is too large. Take another one with less zoom.',
    noItems: 'I found no items in this photo. Check that the receipt is whole and legible.',
    quotaOver: 'The free reading quota is used up for now. Try again later.',
    keyRefused: 'The receipt reading key was refused.',
    readFailed: 'Reading the receipt failed. Try again.',
    emptyRead: 'The reading came back empty. Try again.',
    cantReadImage: 'I could not read this image. Try another photo.',
  },

  nfce: {
    noQr: 'This receipt has no QR code.',
    notSefaz: 'This QR code does not point to a Brazilian tax authority portal.',
    badKey: 'I did not recognize this receipt key. Try scanning the QR code again.',
    dailyLimit: 'Too many receipts in the last 24 hours. Try again tomorrow.',
    unknownLayout:
      'I opened the receipt, but I did not understand this state’s item list. Photograph the receipt and I will read the image instead.',
    timeout: 'The tax authority portal took too long to answer. Try again.',
    failed: 'I could not fetch this receipt. Photograph it and I will read the image instead.',
  },
};

const DICTS: Record<Lang, Dict> = { 'pt-BR': pt, en };

export function t(lang: Lang): Dict {
  return DICTS[lang];
}
