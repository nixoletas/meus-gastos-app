/**
 * Conteúdo legal do app (Política de Privacidade e Termos de Uso), em
 * português e inglês. Fonte única usada pelas telas in-app. As versões para
 * hospedar na web ficam em /legal/*.html (mantenha os dois em sincronia).
 *
 * O texto em português é o que vale juridicamente: o app é brasileiro e a LGPD
 * é a lei aplicável. A versão em inglês é uma tradução de cortesia, e diz isso.
 *
 * IMPORTANTE: troque CONTACT_EMAIL e CONTROLLER pelo seu e-mail/identificação
 * reais antes de publicar.
 */
import { Lang } from '../i18n/active';

export const CONTACT_EMAIL = 'contato@meusgastos.dev.br';
/** Formulário para reclamações, pedidos de feature e dúvidas. */
export const FEEDBACK_FORM_URL = 'https://forms.gle/od4DdV7uanvcwxTh8';
export const CONTROLLER = 'a equipe do Meus Gastos';
const CONTROLLER_EN = 'the Meus Gastos team';
export const LAST_UPDATED = '24 de agosto de 2026';
const LAST_UPDATED_EN = 'August 24, 2026';

export type LegalSection = { title: string; body: string[] };

export const PRIVACY: LegalSection[] = [
  {
    title: 'Quem somos',
    body: [
      `O Meus Gastos é um aplicativo para controle de gastos pessoais. Esta Política explica como tratamos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). O controlador dos dados é ${CONTROLLER}, que você pode contatar em ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: 'Quais dados coletamos',
    body: [
      'Dados de conta: ao entrar com o Google, recebemos seu e-mail, nome e foto de perfil.',
      'Dados que você cria no app: seus gastos (valor, data, nota), categorias, subcategorias e limites de gasto.',
      'Fotos de notas fiscais que você escolher anexar a um gasto, e os itens lidos delas (descrição, quantidade e valor de cada produto), junto de dados impressos na nota como estabelecimento, CNPJ, data e forma de pagamento.',
      'Dados técnicos básicos necessários para o funcionamento (ex.: identificador da sessão).',
      'Não pedimos dados bancários, número de cartão, CPF ou localização. Atenção: a foto de uma nota fiscal pode conter o CNPJ do estabelecimento e, se você pediu CPF na nota, o seu CPF — esses dados ficam dentro da imagem que você anexou.',
    ],
  },
  {
    title: 'Para que usamos',
    body: [
      'Para autenticar seu acesso (login com Google) e manter sua sessão.',
      'Para armazenar e sincronizar seus lançamentos entre seus dispositivos.',
      'Para gerar os gráficos, resumos e alertas de limite dentro do app.',
      'Para ler os itens da nota fiscal que você fotografa e transformá-los nas subcompras do lançamento — só quando você usa esse recurso.',
    ],
  },
  {
    title: 'Base legal',
    body: [
      'Tratamos seus dados para a execução do serviço que você solicitou (art. 7º, V da LGPD) e, quando aplicável, mediante o seu consentimento, que pode ser retirado a qualquer momento.',
    ],
  },
  {
    title: 'Com quem compartilhamos',
    body: [
      'Supabase: provedor de autenticação e banco de dados onde seus dados ficam armazenados.',
      'SEFAZ do seu estado: quando você lê o QR Code de um cupom fiscal, consultamos a página pública daquela nota para trazer os itens. Nesse caminho nenhuma imagem é enviada a terceiros.',
      'Google: usado para autenticar seu acesso (login com a conta Google) e, através da API Gemini, para ler a foto da nota fiscal que você anexa. A imagem só é enviada quando você usa o recurso de notinha. Hoje usamos o nível gratuito dessa API, e nele o Google pode usar o conteúdo enviado para melhorar os produtos dele, inclusive com revisão humana. Por isso: não anexe uma nota que você não queira que saia do app.',
      'Não vendemos seus dados nem os usamos para publicidade.',
    ],
  },
  {
    title: 'Armazenamento e segurança',
    body: [
      'Seus dados são protegidos por regras de acesso por usuário (Row Level Security): cada pessoa só acessa os próprios dados.',
      'A comunicação com o servidor é criptografada (HTTPS).',
    ],
  },
  {
    title: 'Seus direitos',
    body: [
      'Você pode acessar, corrigir e excluir seus dados a qualquer momento.',
      'A exclusão da conta está disponível em Ajustes › Excluir conta, e apaga permanentemente todos os seus dados (gastos, categorias e limites).',
      `Para outras solicitações relacionadas aos seus dados, escreva para ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: 'Retenção',
    body: [
      'Mantemos seus dados enquanto sua conta existir. Ao excluir a conta, os dados são removidos de imediato.',
      'A foto de uma notinha é apagada junto com o gasto ao qual ela pertence, e todas as fotos são apagadas quando você exclui a conta.',
    ],
  },
  {
    title: 'Crianças e adolescentes',
    body: [
      'O app não é direcionado a menores de 18 anos. Se você é responsável e acredita que um menor nos forneceu dados, entre em contato para removermos.',
    ],
  },
  {
    title: 'Alterações',
    body: [
      'Podemos atualizar esta Política. Mudanças relevantes serão informadas no app. A data da última atualização está no topo desta página.',
    ],
  },
];

export const TERMS: LegalSection[] = [
  {
    title: 'Aceitação',
    body: [
      'Ao usar o Meus Gastos, você concorda com estes Termos de Uso. Se não concordar, não utilize o app.',
    ],
  },
  {
    title: 'O que o app faz',
    body: [
      'O Meus Gastos é uma ferramenta de organização financeira pessoal para você registrar e acompanhar seus gastos. Os valores são informados manualmente por você.',
    ],
  },
  {
    title: 'Sua conta',
    body: [
      'Você é responsável por manter o acesso à conta Google usada para entrar.',
      'Você é responsável pelas informações que cadastra no app.',
    ],
  },
  {
    title: 'Não é consultoria financeira',
    body: [
      'O app oferece organização e visualização de dados que você mesmo insere. Ele não constitui aconselhamento financeiro, contábil ou de investimentos. Decisões financeiras são de sua responsabilidade.',
    ],
  },
  {
    title: 'Uso aceitável',
    body: [
      'Você concorda em não usar o app para fins ilícitos nem tentar burlar a segurança ou acessar dados de outras pessoas.',
    ],
  },
  {
    title: 'Disponibilidade e limitação de responsabilidade',
    body: [
      'O serviço é fornecido "como está". Nos esforçamos para mantê-lo disponível e correto, mas não garantimos funcionamento ininterrupto nem nos responsabilizamos por perdas decorrentes de indisponibilidade ou de dados inseridos incorretamente.',
    ],
  },
  {
    title: 'Propriedade intelectual',
    body: [
      'A marca, o design e o código do Meus Gastos pertencem aos seus criadores. Os dados que você cadastra continuam sendo seus.',
    ],
  },
  {
    title: 'Encerramento',
    body: [
      'Você pode excluir sua conta a qualquer momento em Ajustes. Podemos suspender contas que violem estes Termos.',
    ],
  },
  {
    title: 'Lei aplicável',
    body: [
      'Estes Termos são regidos pelas leis do Brasil, eleito o foro do domicílio do usuário para dirimir eventuais controvérsias.',
    ],
  },
  {
    title: 'Contato',
    body: [`Dúvidas sobre estes Termos? Escreva para ${CONTACT_EMAIL}.`],
  },
];

const PRIVACY_EN: LegalSection[] = [
  {
    title: 'Who we are',
    body: [
      `Meus Gastos is a personal expense tracking app. This Policy explains how we handle your data, in line with the Brazilian General Data Protection Law (LGPD – Law No. 13,709/2018). The data controller is ${CONTROLLER_EN}, reachable at ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: 'What data we collect',
    body: [
      'Account data: when you sign in with Google, we receive your email, name and profile picture.',
      'Data you create in the app: your expenses (amount, date, note), categories, subcategories and spending limits.',
      'Photos of receipts you choose to attach to an expense, and the items read from them (description, quantity and price of each product), along with data printed on the receipt such as the merchant, its tax ID, date and payment method.',
      'Basic technical data needed to run the service (e.g. the session identifier).',
      'We do not ask for bank details, card numbers, national ID numbers or your location. Note: a receipt photo may contain the merchant tax ID and, if you asked for your own tax ID on the receipt, yours as well — that data lives inside the image you attached.',
    ],
  },
  {
    title: 'What we use it for',
    body: [
      'To authenticate you (Google sign-in) and keep your session.',
      'To store and sync your entries across your devices.',
      'To build the charts, summaries and limit alerts inside the app.',
      'To read the items from the receipt you photograph and turn them into the entry’s line items — only when you use that feature.',
    ],
  },
  {
    title: 'Legal basis',
    body: [
      'We process your data to deliver the service you asked for (art. 7, V of the LGPD) and, where applicable, based on your consent, which you can withdraw at any time.',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'Supabase: the authentication and database provider where your data is stored.',
      'Your state tax authority (SEFAZ): when you scan the QR code on a tax receipt, we fetch that receipt’s public page to bring in the items. No image is sent to third parties on this path.',
      'Google: used to authenticate you (Google sign-in) and, through the Gemini API, to read the receipt photo you attach. The image is only sent when you use the receipt feature. We currently use the free tier of that API, where Google may use submitted content to improve its products, including human review. So: do not attach a receipt you would not want leaving the app.',
      'We do not sell your data and do not use it for advertising.',
    ],
  },
  {
    title: 'Storage and security',
    body: [
      'Your data is protected by per-user access rules (Row Level Security): each person can only reach their own data.',
      'Communication with the server is encrypted (HTTPS).',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'You can access, correct and delete your data at any time.',
      'Account deletion is available under Settings › Delete account, and permanently erases all of your data (expenses, categories and limits).',
      `For any other request about your data, write to ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: 'Retention',
    body: [
      'We keep your data for as long as your account exists. When you delete the account, the data is removed immediately.',
      'A receipt photo is deleted along with the expense it belongs to, and all photos are deleted when you delete your account.',
    ],
  },
  {
    title: 'Children and teenagers',
    body: [
      'The app is not directed at people under 18. If you are a guardian and believe a minor gave us data, contact us so we can remove it.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'We may update this Policy. Relevant changes will be announced in the app. The date of the last update is at the top of this page.',
      'This English text is a courtesy translation. The Portuguese version is the binding one, and Brazilian law applies.',
    ],
  },
];

const TERMS_EN: LegalSection[] = [
  {
    title: 'Acceptance',
    body: [
      'By using Meus Gastos, you agree to these Terms of Use. If you do not agree, do not use the app.',
    ],
  },
  {
    title: 'What the app does',
    body: [
      'Meus Gastos is a personal finance organization tool for recording and tracking your expenses. The amounts are entered manually by you.',
    ],
  },
  {
    title: 'Your account',
    body: [
      'You are responsible for keeping access to the Google account you sign in with.',
      'You are responsible for the information you enter in the app.',
    ],
  },
  {
    title: 'Not financial advice',
    body: [
      'The app organizes and visualizes data you enter yourself. It is not financial, accounting or investment advice. Financial decisions are your own responsibility.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'You agree not to use the app for unlawful purposes, nor to attempt to bypass its security or access other people’s data.',
    ],
  },
  {
    title: 'Availability and limitation of liability',
    body: [
      'The service is provided "as is". We work to keep it available and correct, but we do not guarantee uninterrupted operation, and we are not liable for losses arising from downtime or from data entered incorrectly.',
    ],
  },
  {
    title: 'Intellectual property',
    body: [
      'The Meus Gastos brand, design and code belong to its creators. The data you enter remains yours.',
    ],
  },
  {
    title: 'Termination',
    body: [
      'You can delete your account at any time under Settings. We may suspend accounts that violate these Terms.',
    ],
  },
  {
    title: 'Governing law',
    body: [
      'These Terms are governed by the laws of Brazil, with the courts of the user’s domicile chosen to settle any disputes.',
      'This English text is a courtesy translation; the Portuguese version prevails.',
    ],
  },
  {
    title: 'Contact',
    body: [`Questions about these Terms? Write to ${CONTACT_EMAIL}.`],
  },
];

type LegalDocs = {
  lastUpdated: string;
  privacy: LegalSection[];
  terms: LegalSection[];
};

const LEGAL: Record<Lang, LegalDocs> = {
  'pt-BR': { lastUpdated: LAST_UPDATED, privacy: PRIVACY, terms: TERMS },
  en: { lastUpdated: LAST_UPDATED_EN, privacy: PRIVACY_EN, terms: TERMS_EN },
};

export function legalFor(lang: Lang): LegalDocs {
  return LEGAL[lang];
}
