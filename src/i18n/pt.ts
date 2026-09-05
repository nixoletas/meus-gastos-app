/**
 * Textos em português do Brasil — idioma de referência.
 *
 * `en.ts` é tipado como `Dict`, então toda chave nova aqui precisa de tradução
 * lá (e o TypeScript avisa se faltar).
 */
export const pt = {
  common: {
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    remove: 'Remover',
    close: 'Fechar',
    back: 'Voltar',
    edit: 'Editar',
    loading: 'Carregando...',
    error: 'Erro',
    ok: 'OK',
    tryAgain: 'Tentar de novo',
    continue: 'Continuar',
    month: 'Mês',
    year: 'Ano',
    noCategory: 'Sem categoria',
    noSubcategory: 'Sem subcategoria',
    generalLimit: 'Limite geral',
    general: 'Geral',
    expense: 'Gasto',
    item: 'item',
    items: 'itens',
    receipt: 'notinha',
    entry: 'lançamento',
    entries: 'lançamentos',
  },

  tabs: {
    home: 'Início',
    charts: 'Gráficos',
    categories: 'Categorias',
    limits: 'Limites',
    family: 'Família',
    more: 'Mais',
    settings: 'Ajustes',
  },

  home: {
    greeting: (name: string) => `Bora poupar, ${name}!`,
    fallbackName: 'você',
    totalMonth: 'Total gasto no mês',
    totalYear: 'Total gasto no ano',
    entriesCount: (n: number) => `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`,
    trendMonth: (signed: string) => `${signed}% vs mês anterior`,
    trendYear: (signed: string) => `${signed}% vs ano anterior`,
    limitExceeded: 'Limite ultrapassado',
    limitNear: 'Perto do limite',
    alertAmounts: (spent: string, limit: string, percent: number) =>
      `${spent} de ${limit} (${percent}%)`,
    spendingLimits: 'Limite de gastos',
    manage: 'Gerenciar',
    setLimitTitle: 'Defina um limite',
    setLimitText: 'Receba alertas ao se aproximar do teto de gastos.',
    overBy: (amount: string) => `Ultrapassou ${amount}`,
    remainingToLimit: (amount: string) => `Faltam ${amount} para o limite`,
    entriesTitle: 'Lançamentos',
    preparingCategories: 'Preparando suas categorias...',
    emptyTitle: 'Nenhum gasto por aqui',
    emptyText: 'Toque no botão + para lançar seu primeiro gasto deste período.',
  },

  charts: {
    title: 'Gráficos',
    emptyTitle: 'Sem dados neste período',
    emptyText: 'Lance alguns gastos para ver a distribuição por categoria.',
    percentOfTotal: (percent: number) => `${percent}% do total`,
    total: 'Total',
    tapSlice: 'toque numa fatia',
    clearFilter: 'Limpar filtro',
  },

  categories: {
    title: 'Categorias',
    new: 'Nova',
    searchPlaceholder: 'Buscar categoria ou subcategoria',
    add: 'Adicionar',
    createNamed: (name: string) => `Criar “${name}”`,
    createHint: 'Nenhuma categoria encontrada. Toque para criar uma nova com esse nome.',
    empty: 'Nenhuma categoria ainda.',
  },

  limits: {
    title: 'Meus Limites',
    intro:
      'Defina um teto de gastos (geral ou por categoria) e o app avisa quando você se aproximar (80%) ou ultrapassar o limite.',
    monthly: 'Mensal',
    yearly: 'Anual',
    budgetSub: (kind: string, spent: string, limit: string) =>
      `${kind} · ${spent} de ${limit}`,
    usedPercent: (percent: number) => `${percent}% utilizado`,
    overBy: (amount: string) => `Ultrapassou ${amount}`,
    remaining: (amount: string) => `Faltam ${amount}`,
    newLimit: 'Novo limite',
    applyTo: 'Aplicar a',
    limitAmount: 'Valor do limite',
    amountPlaceholder: '0,00',
    saveLimit: 'Salvar limite',
    removeTitle: (label: string) => `Remover o limite de “${label}”?`,
    removeMessage:
      'Os gastos continuam registrados; o app só para de avisar quando esse teto for alcançado.',
  },

  settings: {
    title: 'Ajustes',
    appearance: 'APARÊNCIA',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeSystem: 'Sistema',
    language: 'IDIOMA',
    account: 'CONTA',
    connected: 'Conectado',
    syncedInCloud: 'Sincronizado na nuvem',
    signOut: 'Sair',
    reports: 'RELATÓRIOS',
    exportExcel: 'Exportar para Excel',
    exportExcelSub: 'Relatório mensal ou anual no seu e-mail',
    about: 'SOBRE',
    privacyPolicy: 'Política de Privacidade',
    termsOfUse: 'Termos de Uso',
    feedback: 'Reclamar, pedir feature ou tirar dúvida',
    emailCopied: 'E-mail copiado!',
    contactUs: 'Falar com a gente',
    version: 'Versão',
    dangerZone: 'ZONA DE PERIGO',
    deleteAccount: 'Excluir conta',
    deleteHint:
      'Apaga permanentemente sua conta e todos os dados (gastos, categorias e limites).',
    footer: 'Meus Gastos · feito no Brasil 🇧🇷',
    deleteModalTitle: 'Já vai mesmo? Vamos sentir sua falta...',
    deleteModalBody:
      'A gente acompanhou cada gasto seu com carinho. Se você excluir sua conta, todo esse histórico — seus gastos, categorias e limites — vai desaparecer para sempre, e não tem como voltar atrás. 💔',
    deleteConfirmPrefix: 'Para confirmar, digite',
    deleteConfirmWord: 'excluir',
    deleteConfirmSuffix: ' abaixo.',
    deleteStay: 'Quero ficar 💚',
    deleteAnyway: 'Excluir minha conta mesmo assim',
  },

  sharing: {
    section: 'FAMÍLIA',
    title: 'Compartilhar meus gastos',
    subtitleNobody: 'Ninguém acompanha seus gastos',
    subtitleCount: (n: number) =>
      n === 1 ? '1 pessoa acompanha seus gastos' : `${n} pessoas acompanham seus gastos`,
    subtitleViewing: (name: string) => `Vendo os gastos de ${name}`,

    myLedgers: 'CADERNOS',
    myLedger: 'Meus gastos',
    active: 'Aberto agora',
    roleOwner: 'Você é o dono',
    roleViewer: 'Só leitura',
    roleEditor: 'Pode editar',
    leave: 'Sair deste caderno',
    leaveConfirmTitle: 'Sair do caderno?',
    leaveConfirmBody: (name: string) =>
      `Você deixa de ver os gastos de ${name}. Seus próprios gastos não mudam em nada.`,

    whoSees: 'QUEM VÊ MEUS GASTOS',
    inviteEmailLabel: 'E-mail de quem vai acompanhar',
    inviteEmailPlaceholder: 'nome@gmail.com',
    inviteHint:
      'Precisa ser o mesmo e-mail da conta Google que a pessoa usa para entrar. O acesso aparece para ela no próximo login.',
    invitePermission: 'Permissão',
    inviteButton: 'Convidar',
    inviting: 'Convidando…',
    pending: 'Aguardando entrar',
    emptyMembers: 'Ninguém por aqui ainda. Convide alguém da família.',
    revoke: 'Remover acesso',
    revokeConfirmTitle: 'Remover acesso?',
    revokeConfirmBody: (name: string) =>
      `${name} deixa de ver seus gastos na hora. Os lançamentos que essa pessoa criou continuam no seu caderno.`,

    viewingBanner: (name: string) => `Vendo os gastos de ${name}`,
    readOnlyBadge: 'só leitura',
    revokedNotice: (name: string) =>
      name
        ? `${name} encerrou seu acesso. Você voltou para os seus gastos.`
        : 'Seu acesso a esse caderno foi encerrado. Você voltou para os seus gastos.',

    errors: {
      invalidEmail: 'E-mail inválido.',
      selfInvite: 'Esse é o seu próprio e-mail.',
      limit: 'Você já convidou o máximo de pessoas.',
      notFound: 'Convite não encontrado. Atualize a tela.',
      noPermission: 'Você não tem permissão para isso.',
      generic: 'Não consegui completar. Tente de novo.',
    },
  },

  expenseRow: {
    itemsCount: (n: number) => `${n} ${n === 1 ? 'item' : 'itens'}`,
    noItems: 'Esse lançamento não tem itens.',
    defaultUnit: 'un',
  },

  confirm: {
    defaultConfirm: 'Excluir',
    defaultCancel: 'Cancelar',
  },

  expense: {
    editTitle: 'Editar gasto',
    newTitle: 'Novo gasto',
    amountPlaceholder: '0,00',
    category: 'Categoria',
    create: 'Criar',
    subcategory: 'Subcategoria',
    optional: '(opcional)',
    when: 'Quando',
    today: 'Hoje',
    yesterday: 'Ontem',
    otherDate: 'Outra data',
    notes: 'Notas',
    notePlaceholder: 'Adicione uma nota (opcional)',
    saveAndNew: 'Salvar e lançar outro',
    saveChanges: 'Salvar alterações',
    save: 'Lançar gasto',
    flashSaved: (amount: string) => `${amount} lançado`,
    deleteTitle: 'Excluir este gasto?',
    deleteMessage: 'O lançamento some do histórico e dos gráficos. Não dá pra desfazer.',
  },

  categoryForm: {
    editSub: 'Editar subcategoria',
    editCat: 'Editar categoria',
    newSub: 'Nova subcategoria',
    newCat: 'Nova categoria',
    changeIcon: 'Trocar ícone',
    childOf: 'Subcategoria de',
    name: 'Nome',
    subNamePlaceholder: 'Ex.: Mercado',
    catNamePlaceholder: 'Ex.: Alimentação',
    color: 'Cor',
    deleteTitle: (kind: string, name: string) => `Excluir ${kind} “${name}”?`,
    kindSub: 'subcategoria',
    kindCat: 'categoria',
    deleteSubMessage: 'Os gastos lançados nela continuam, mas ficam sem subcategoria.',
    deleteCatWithSubs: (count: number) =>
      `As ${count} subcategorias também serão removidas. Os gastos continuam, mas ficam sem categoria.`,
    deleteCatMessage: 'Os gastos lançados nela continuam, mas ficam sem categoria.',
    undoWarning: 'Esta ação não pode ser desfeita.',
  },

  login: {
    slogan: 'Pra onde vai cada centavo.',
    google: 'Continuar com Google',
    hint: 'Entre com sua conta Google. Sem senha, sem complicação.',
    consentPrefix: 'Ao continuar, você concorda com os',
    terms: 'Termos de Uso',
    consentMiddle: 'e a',
    privacy: 'Política de Privacidade',
  },

  onboarding: {
    skip: 'Pular',
    start: 'Começar',
    next: 'Próximo',
    slides: [
      {
        title: 'Cadê o dinheiro? 🤨',
        text: 'Todo fim de mês some uma grana e você nem sabe onde foi parar. Bora descobrir juntos?',
      },
      {
        title: 'Lançar é num piscar',
        text: 'Anotar um gasto leva uns 5 segundos: valor, categoria com ícone bonito e pronto. Sem preguiça.',
      },
      {
        title: 'Veja onde dá pra cortar',
        text: 'Gráficos e limites mostram pra onde sua grana está indo — e onde dá pra economizar sem sofrer.',
      },
      {
        title: 'Pra onde vai cada centavo.',
        text: 'Quem controla os gastos sobra mais no fim do mês. Esse é o primeiro passo pra poupar de verdade.',
      },
    ],
  },

  legal: {
    lastUpdated: (date: string) => `Última atualização: ${date}`,
  },

  receiptPhoto: {
    title: 'Notinha',
    notFound: 'Notinha não encontrada.',
    fromQr: 'Essa notinha veio do QR Code do cupom, sem foto.',
    cantOpen: 'Não consegui abrir a foto.',
  },

  qrcode: {
    title: 'Ler QR do cupom',
    notAReceipt: 'Esse QR Code não é de uma nota fiscal. Aponte para o QR do cupom.',
    needCamera: 'Preciso da câmera para ler o QR Code do cupom.',
    allowCamera: 'Liberar câmera',
    webHint: 'No navegador, use o campo "colar link do QR" na tela de lançamento.',
    aim: 'Aponte para o QR Code impresso no rodapé do cupom fiscal.',
    aimSub: 'Os itens vêm direto da SEFAZ — sem foto, sem erro de leitura.',
  },

  setup: {
    title: 'Falta configurar o Supabase',
    subtitle:
      'O Meus Gastos usa o Supabase para login e sincronização entre o celular e a web. Siga os passos abaixo uma única vez:',
    steps: [
      'Crie uma conta gratuita em supabase.com e um novo projeto.',
      'No painel do Supabase, abra o "SQL Editor" e rode o conteúdo do arquivo supabase/schema.sql.',
      'Vá em Project Settings > API e copie a "Project URL" e a chave "anon public".',
      'Copie o arquivo .env.example para .env e cole esses dois valores.',
      'Pare o servidor e rode novamente: npx expo start --clear',
    ],
  },

  calendar: {
    today: 'Hoje',
  },

  iconPicker: {
    tabIcons: 'Ícones',
    tabEmojis: 'Emojis',
    emojiSearchPlaceholder: 'Buscar emoji (ex.: pizza, carro...)',
    pasteEmoji: 'Ou cole qualquer emoji',
    emojiEmpty: 'Nenhum emoji encontrado.',
    use: 'Usar',
    count: (n: number) => `${n} ${n === 1 ? 'ícone' : 'ícones'}`,
    title: 'Escolha um ícone',
    searchPlaceholder: 'Buscar ícone (ex.: comida, carro...)',
    empty: 'Nenhum ícone encontrado.',
  },

  itemEditor: {
    editTitle: 'Editar item',
    newTitle: 'Novo item',
    description: 'Descrição',
    descriptionPlaceholder: 'Ex.: Banana prata',
    quantity: 'Quantidade',
    unit: 'Unidade',
    amount: 'Valor',
  },

  receiptSection: {
    label: 'Notinha e itens',
    countAndTotal: (count: number, total: string) =>
      `${count} ${count === 1 ? 'item' : 'itens'} · ${total}`,
    scanQr: 'Ler QR do cupom',
    takePhoto: 'Fotografar',
    fromGallery: 'Da galeria',
    uploading: 'Enviando a foto…',
    queryingSefaz: 'Consultando a nota na SEFAZ…',
    readingReceipt: 'Lendo sua notinha…',
    keepGoing: 'Pode continuar preenchendo, eu aviso quando terminar.',
    readFailed: 'Não consegui ler essa foto.',
    photographNote: 'Fotografar a nota',
    anotherPhoto: 'Outra foto',
    taxReceipt: 'Nota fiscal',
    attachedReceipt: 'Notinha anexada',
    receiptTotal: (total: string) => `Total na nota: ${total}`,
    duplicate: 'Essa nota fiscal já foi lançada antes. Se não for engano, pode continuar.',
    mismatch: (itemsTotal: string, receiptTotal: string) =>
      `Os itens somam ${itemsTotal}, mas a nota diz ${receiptTotal}. Confira as linhas.`,
    addItem: 'Adicionar item',
    useTotal: (total: string) => `Usar ${total}`,
    footerHint:
      'O QR do cupom traz os itens direto da SEFAZ, sem enviar imagem. Na foto, quem lê é o Google — e ela funciona em qualquer recibo.',
    issuedAt: (date: string, time: string) => `${date} às ${time}`,
    payment: {
      credito: 'Crédito',
      debito: 'Débito',
      pix: 'Pix',
      dinheiro: 'Dinheiro',
      vale: 'Vale',
      outro: 'Outro',
    },
  },

  report: {
    title: 'Exportar relatório',
    subtitle: 'Uma planilha Excel bonita com todos os seus gastos do período.',
    monthly: 'Mensal',
    yearly: 'Anual',
    sendEmail: 'Enviar no meu e-mail',
    download: 'Baixar / compartilhar',
    oops: 'Ops',
    genericError: 'Não consegui gerar o relatório.',
    noExpensesTitle: 'Sem gastos',
    noExpenses: (period: string) => `Não há lançamentos em ${period} para exportar.`,
    sentTitle: 'Enviado! 📬',
    sent: (period: string, email: string) => `Seu relatório de ${period} foi para ${email}.`,
    yourEmail: 'seu e-mail',
    doneTitle: 'Pronto',
    noSharing: 'Arquivo gerado, mas o compartilhamento não está disponível neste aparelho.',
    saveFailed: 'Não consegui salvar o arquivo.',
    shareTitle: (period: string) => `Relatório ${period}`,
  },

  success: {
    registered: 'Gasto registrado 🎉',
  },

  errors: {
    noConnection: 'Sem conexão. Verifique sua internet.',
    playServices: 'Google Play Services indisponível ou desatualizado.',
    rateLimit: 'Muitas tentativas. Aguarde um instante e tente de novo.',
    cameraPermission:
      'Preciso da câmera para fotografar a notinha. Libere nos ajustes do aparelho.',
    photosPermission: 'Preciso do acesso às fotos para anexar a notinha.',
    photoPrepare: 'Não consegui preparar a foto. Tente outra.',
    registerReceipt: 'Não consegui registrar a notinha.',
    readReceipt: 'Não consegui ler a notinha.',
    readQr: 'Não consegui ler esse QR Code.',
  },
};

export type Dict = typeof pt;
