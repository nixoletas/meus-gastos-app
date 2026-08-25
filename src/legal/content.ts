/**
 * Conteúdo legal do app (Política de Privacidade e Termos de Uso).
 * Fonte única usada pelas telas in-app. As versões para hospedar na web
 * ficam em /legal/*.html (mantenha os dois em sincronia ao editar).
 *
 * IMPORTANTE: troque CONTACT_EMAIL e CONTROLLER pelo seu e-mail/identificação
 * reais antes de publicar.
 */

export const CONTACT_EMAIL = 'contato@meusgastos.dev.br';
/** Formulário para reclamações, pedidos de feature e dúvidas. */
export const FEEDBACK_FORM_URL = 'https://forms.gle/od4DdV7uanvcwxTh8';
export const CONTROLLER = 'a equipe do Meus Gastos';
export const LAST_UPDATED = '24 de agosto de 2026';

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
