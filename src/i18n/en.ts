/** English strings. Mirrors `pt.ts` — the type keeps both in sync. */
import type { Dict } from './pt';

export const en: Dict = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    remove: 'Remove',
    close: 'Close',
    back: 'Back',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    ok: 'OK',
    tryAgain: 'Try again',
    continue: 'Continue',
    month: 'Month',
    year: 'Year',
    noCategory: 'No category',
    noSubcategory: 'No subcategory',
    generalLimit: 'Overall limit',
    general: 'Overall',
    expense: 'Expense',
    item: 'item',
    items: 'items',
    receipt: 'receipt',
    entry: 'entry',
    entries: 'entries',
  },

  tabs: {
    home: 'Home',
    charts: 'Charts',
    categories: 'Categories',
    limits: 'Limits',
    family: 'Family',
    more: 'More',
    settings: 'Settings',
  },

  home: {
    greeting: (name: string) => `Let's save, ${name}!`,
    fallbackName: 'friend',
    totalMonth: 'Total spent this month',
    totalYear: 'Total spent this year',
    entriesCount: (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`,
    trendMonth: (signed: string) => `${signed}% vs last month`,
    trendYear: (signed: string) => `${signed}% vs last year`,
    limitExceeded: 'Limit exceeded',
    limitNear: 'Close to the limit',
    alertAmounts: (spent: string, limit: string, percent: number) =>
      `${spent} of ${limit} (${percent}%)`,
    spendingLimits: 'Spending limits',
    manage: 'Manage',
    setLimitTitle: 'Set a limit',
    setLimitText: 'Get alerts as you approach your spending cap.',
    overBy: (amount: string) => `Over by ${amount}`,
    remainingToLimit: (amount: string) => `${amount} left before the limit`,
    entriesTitle: 'Entries',
    preparingCategories: 'Setting up your categories...',
    emptyTitle: 'No expenses here yet',
    emptyText: 'Tap the + button to log your first expense for this period.',
  },

  charts: {
    title: 'Charts',
    emptyTitle: 'No data for this period',
    emptyText: 'Log a few expenses to see the breakdown by category.',
    percentOfTotal: (percent: number) => `${percent}% of total`,
    total: 'Total',
    tapSlice: 'tap a slice',
    clearFilter: 'Clear filter',
  },

  categories: {
    title: 'Categories',
    new: 'New',
    searchPlaceholder: 'Search category or subcategory',
    add: 'Add',
    createNamed: (name: string) => `Create “${name}”`,
    createHint: 'No category found. Tap to create one with this name.',
    empty: 'No categories yet.',
  },

  limits: {
    title: 'My Limits',
    intro:
      'Set a spending cap (overall or per category) and the app warns you when you get close (80%) or go over it.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    budgetSub: (kind: string, spent: string, limit: string) =>
      `${kind} · ${spent} of ${limit}`,
    usedPercent: (percent: number) => `${percent}% used`,
    overBy: (amount: string) => `Over by ${amount}`,
    remaining: (amount: string) => `${amount} left`,
    newLimit: 'New limit',
    applyTo: 'Apply to',
    limitAmount: 'Limit amount',
    amountPlaceholder: '0.00',
    saveLimit: 'Save limit',
    removeTitle: (label: string) => `Remove the “${label}” limit?`,
    removeMessage:
      'Your expenses stay recorded; the app just stops warning you when this cap is reached.',
  },

  settings: {
    title: 'Settings',
    appearance: 'APPEARANCE',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'LANGUAGE',
    account: 'ACCOUNT',
    connected: 'Signed in',
    syncedInCloud: 'Synced to the cloud',
    signOut: 'Sign out',
    reports: 'REPORTS',
    exportExcel: 'Export to Excel',
    exportExcelSub: 'Monthly or yearly report in your inbox',
    about: 'ABOUT',
    privacyPolicy: 'Privacy Policy',
    termsOfUse: 'Terms of Use',
    feedback: 'Report a problem, request a feature or ask a question',
    emailCopied: 'Email copied!',
    contactUs: 'Talk to us',
    version: 'Version',
    dangerZone: 'DANGER ZONE',
    deleteAccount: 'Delete account',
    deleteHint:
      'Permanently erases your account and all data (expenses, categories and limits).',
    footer: 'Meus Gastos · made in Brazil 🇧🇷',
    deleteModalTitle: 'Leaving already? We will miss you...',
    deleteModalBody:
      'We tracked every expense of yours with care. If you delete your account, all of this history — your expenses, categories and limits — is gone for good, with no way back. 💔',
    deleteConfirmPrefix: 'To confirm, type',
    deleteConfirmWord: 'delete',
    deleteConfirmSuffix: ' below.',
    deleteStay: "I'll stay 💚",
    deleteAnyway: 'Delete my account anyway',
  },

  sharing: {
    section: 'FAMILY',
    title: 'Share my expenses',
    subtitleNobody: 'Nobody follows your expenses',
    subtitleCount: (n: number) =>
      n === 1 ? '1 person follows your expenses' : `${n} people follow your expenses`,
    subtitleViewing: (name: string) => `Viewing ${name}'s expenses`,

    myLedgers: 'LEDGERS',
    myLedger: 'My expenses',
    active: 'Open now',
    roleOwner: 'You own it',
    roleViewer: 'View only',
    roleEditor: 'Can edit',
    leave: 'Leave this ledger',
    leaveConfirmTitle: 'Leave the ledger?',
    leaveConfirmBody: (name: string) =>
      `You will stop seeing ${name}'s expenses. Your own expenses are untouched.`,

    whoSees: 'WHO SEES MY EXPENSES',
    inviteEmailLabel: 'E-mail of the person who will follow along',
    inviteEmailPlaceholder: 'name@gmail.com',
    inviteHint:
      'It must be the same e-mail of the Google account they sign in with. Access shows up for them on their next sign-in.',
    invitePermission: 'Permission',
    inviteButton: 'Invite',
    inviting: 'Inviting…',
    pending: 'Waiting to join',
    emptyMembers: 'Nobody here yet. Invite someone from your family.',
    revoke: 'Remove access',
    revokeConfirmTitle: 'Remove access?',
    revokeConfirmBody: (name: string) =>
      `${name} stops seeing your expenses right away. Entries they created stay in your ledger.`,

    viewingBanner: (name: string) => `Viewing ${name}'s expenses`,
    readOnlyBadge: 'view only',
    revokedNotice: (name: string) =>
      name
        ? `${name} ended your access. You are back on your own expenses.`
        : 'Your access to that ledger ended. You are back on your own expenses.',

    errors: {
      invalidEmail: 'Invalid e-mail.',
      selfInvite: "That's your own e-mail.",
      limit: 'You have already invited the maximum number of people.',
      notFound: 'Invite not found. Refresh the screen.',
      noPermission: "You don't have permission for that.",
      generic: "Couldn't complete. Please try again.",
    },
  },

  expenseRow: {
    itemsCount: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
    noItems: 'This entry has no items.',
    defaultUnit: 'ea',
  },

  confirm: {
    defaultConfirm: 'Delete',
    defaultCancel: 'Cancel',
  },

  expense: {
    editTitle: 'Edit expense',
    newTitle: 'New expense',
    amountPlaceholder: '0.00',
    category: 'Category',
    create: 'Create',
    subcategory: 'Subcategory',
    optional: '(optional)',
    when: 'When',
    today: 'Today',
    yesterday: 'Yesterday',
    otherDate: 'Another date',
    notes: 'Notes',
    notePlaceholder: 'Add a note (optional)',
    saveAndNew: 'Save and add another',
    saveChanges: 'Save changes',
    save: 'Add expense',
    flashSaved: (amount: string) => `${amount} saved`,
    deleteTitle: 'Delete this expense?',
    deleteMessage: 'The entry disappears from your history and charts. This cannot be undone.',
  },

  categoryForm: {
    editSub: 'Edit subcategory',
    editCat: 'Edit category',
    newSub: 'New subcategory',
    newCat: 'New category',
    changeIcon: 'Change icon',
    childOf: 'Subcategory of',
    name: 'Name',
    subNamePlaceholder: 'e.g. Groceries',
    catNamePlaceholder: 'e.g. Food',
    color: 'Color',
    deleteTitle: (kind: string, name: string) => `Delete the “${name}” ${kind}?`,
    kindSub: 'subcategory',
    kindCat: 'category',
    deleteSubMessage: 'Expenses logged under it stay, but lose their subcategory.',
    deleteCatWithSubs: (count: number) =>
      `Its ${count} subcategories will be removed too. Expenses stay, but lose their category.`,
    deleteCatMessage: 'Expenses logged under it stay, but lose their category.',
    undoWarning: 'This cannot be undone.',
  },

  login: {
    slogan: 'Where every cent goes.',
    google: 'Continue with Google',
    hint: 'Sign in with your Google account. No password, no hassle.',
    consentPrefix: 'By continuing, you agree to the',
    terms: 'Terms of Use',
    consentMiddle: 'and the',
    privacy: 'Privacy Policy',
  },

  onboarding: {
    skip: 'Skip',
    start: 'Get started',
    next: 'Next',
    slides: [
      {
        title: 'Where did the money go? 🤨',
        text: 'Every month some cash vanishes and you have no idea where. Shall we find out together?',
      },
      {
        title: 'Logging takes a blink',
        text: 'Adding an expense takes about 5 seconds: amount, a category with a nice icon, done.',
      },
      {
        title: 'See where you can cut back',
        text: 'Charts and limits show where your money is going — and where you can save without suffering.',
      },
      {
        title: 'Where every cent goes.',
        text: 'Track your spending and more is left at the end of the month. This is the first step to really saving.',
      },
    ],
  },

  legal: {
    lastUpdated: (date: string) => `Last updated: ${date}`,
  },

  receiptPhoto: {
    title: 'Receipt',
    notFound: 'Receipt not found.',
    fromQr: 'This receipt came from the QR code, so there is no photo.',
    cantOpen: 'Could not open the photo.',
  },

  qrcode: {
    title: 'Scan receipt QR',
    notAReceipt: 'That QR code is not from a tax receipt. Point at the QR code on the receipt.',
    needCamera: 'I need the camera to read the QR code on the receipt.',
    allowCamera: 'Allow camera',
    webHint: 'In the browser, use the "paste QR link" field on the expense screen.',
    aim: 'Point at the QR code printed at the bottom of the receipt.',
    aimSub: 'Items come straight from the tax authority — no photo, no misreading.',
  },

  setup: {
    title: 'Supabase is not configured yet',
    subtitle:
      'Meus Gastos uses Supabase for login and syncing between phone and web. Follow these steps once:',
    steps: [
      'Create a free account at supabase.com and a new project.',
      'In the Supabase dashboard, open the "SQL Editor" and run the contents of supabase/schema.sql.',
      'Go to Project Settings > API and copy the "Project URL" and the "anon public" key.',
      'Copy the .env.example file to .env and paste those two values.',
      'Stop the server and run it again: npx expo start --clear',
    ],
  },

  calendar: {
    today: 'Today',
  },

  iconPicker: {
    tabIcons: 'Icons',
    tabEmojis: 'Emojis',
    emojiSearchPlaceholder: 'Search emoji (e.g. pizza, car...)',
    pasteEmoji: 'Or paste any emoji',
    emojiEmpty: 'No emoji found.',
    use: 'Use',
    count: (n: number) => `${n} ${n === 1 ? 'icon' : 'icons'}`,
    title: 'Pick an icon',
    searchPlaceholder: 'Search icon (e.g. food, car...)',
    empty: 'No icon found.',
  },

  itemEditor: {
    editTitle: 'Edit item',
    newTitle: 'New item',
    description: 'Description',
    descriptionPlaceholder: 'e.g. Bananas',
    quantity: 'Quantity',
    unit: 'Unit',
    amount: 'Amount',
  },

  receiptSection: {
    label: 'Receipt and items',
    countAndTotal: (count: number, total: string) =>
      `${count} ${count === 1 ? 'item' : 'items'} · ${total}`,
    scanQr: 'Scan receipt QR',
    takePhoto: 'Take a photo',
    fromGallery: 'From gallery',
    uploading: 'Uploading the photo…',
    queryingSefaz: 'Fetching the receipt from the tax authority…',
    readingReceipt: 'Reading your receipt…',
    keepGoing: 'Keep filling things in, I will let you know when it is done.',
    readFailed: 'I could not read this photo.',
    photographNote: 'Photograph the receipt',
    anotherPhoto: 'Another photo',
    taxReceipt: 'Tax receipt',
    attachedReceipt: 'Receipt attached',
    receiptTotal: (total: string) => `Total on the receipt: ${total}`,
    duplicate: 'This receipt has been logged before. If that is fine, go ahead.',
    mismatch: (itemsTotal: string, receiptTotal: string) =>
      `The items add up to ${itemsTotal}, but the receipt says ${receiptTotal}. Check the lines.`,
    addItem: 'Add item',
    useTotal: (total: string) => `Use ${total}`,
    footerHint:
      'The receipt QR pulls the items straight from the tax authority, with no image sent. With a photo, Google does the reading — and it works on any receipt.',
    issuedAt: (date: string, time: string) => `${date} at ${time}`,
    payment: {
      credito: 'Credit',
      debito: 'Debit',
      pix: 'Pix',
      dinheiro: 'Cash',
      vale: 'Voucher',
      outro: 'Other',
    },
  },

  report: {
    title: 'Export report',
    subtitle: 'A neat Excel spreadsheet with all your expenses for the period.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    sendEmail: 'Send to my email',
    download: 'Download / share',
    oops: 'Oops',
    genericError: 'I could not build the report.',
    noExpensesTitle: 'No expenses',
    noExpenses: (period: string) => `There are no entries in ${period} to export.`,
    sentTitle: 'Sent! 📬',
    sent: (period: string, email: string) => `Your ${period} report went to ${email}.`,
    yourEmail: 'your email',
    doneTitle: 'Done',
    noSharing: 'File created, but sharing is not available on this device.',
    saveFailed: 'I could not save the file.',
    shareTitle: (period: string) => `${period} report`,
  },

  success: {
    registered: 'Expense saved 🎉',
  },

  errors: {
    noConnection: 'No connection. Check your internet.',
    playServices: 'Google Play Services unavailable or out of date.',
    rateLimit: 'Too many attempts. Wait a moment and try again.',
    cameraPermission:
      'I need the camera to photograph the receipt. Allow it in your device settings.',
    photosPermission: 'I need access to your photos to attach the receipt.',
    photoPrepare: 'I could not prepare the photo. Try another one.',
    registerReceipt: 'I could not register the receipt.',
    readReceipt: 'I could not read the receipt.',
    readQr: 'I could not read this QR code.',
  },
};
