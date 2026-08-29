/**
 * Emojis disponíveis como ícone de categoria.
 *
 * O ícone é gravado como `emoji:<caractere>` na coluna `categories.icon` — a
 * mesma coluna de texto dos glyphs do MDI e dos `brand:`, então nada muda no
 * banco. Quem renderiza os três formatos é o `AppIcon`.
 *
 * A lista é um atalho: o seletor também aceita colar qualquer emoji, inclusive
 * os que não estão aqui.
 */

export type EmojiEntry = {
  char: string;
  /** Palavras-chave em pt-BR. */
  keywords: string[];
  /** Palavras-chave em inglês. */
  en: string[];
};

const raw: [string, string, string][] = [
  // Comida e bebida
  ['🍕', 'pizza comida lanche', 'pizza food snack'],
  ['🍔', 'hamburguer lanche fast food', 'burger snack fast food'],
  ['🍟', 'batata frita lanche', 'fries snack'],
  ['🌭', 'cachorro quente lanche', 'hot dog snack'],
  ['🥪', 'sanduiche lanche', 'sandwich snack'],
  ['🌮', 'taco mexicano comida', 'taco mexican food'],
  ['🌯', 'burrito mexicano comida', 'burrito mexican food'],
  ['🥗', 'salada saudavel comida', 'salad healthy food'],
  ['🍝', 'macarrao massa comida', 'pasta noodles food'],
  ['🍜', 'lamen sopa comida', 'ramen soup food'],
  ['🍣', 'sushi japones comida', 'sushi japanese food'],
  ['🍱', 'marmita bento comida', 'bento lunchbox food'],
  ['🍛', 'prato feito comida almoco', 'curry rice meal lunch'],
  ['🥘', 'panela comida caseira', 'pan homemade food'],
  ['🍲', 'sopa caldo comida', 'stew soup food'],
  ['🥩', 'carne churrasco', 'meat steak barbecue'],
  ['🍗', 'frango comida', 'chicken food'],
  ['🐟', 'peixe comida', 'fish food'],
  ['🍞', 'pao padaria', 'bread bakery'],
  ['🥐', 'croissant padaria cafe', 'croissant bakery coffee'],
  ['🥖', 'pao frances padaria', 'baguette bakery'],
  ['🧀', 'queijo frios', 'cheese dairy'],
  ['🥚', 'ovo cafe da manha', 'egg breakfast'],
  ['🥞', 'panqueca cafe da manha', 'pancake breakfast'],
  ['🍳', 'ovo frito cozinha', 'fried egg cooking'],
  ['🍎', 'maca fruta', 'apple fruit'],
  ['🍌', 'banana fruta', 'banana fruit'],
  ['🍇', 'uva fruta', 'grapes fruit'],
  ['🍓', 'morango fruta', 'strawberry fruit'],
  ['🍉', 'melancia fruta', 'watermelon fruit'],
  ['🥑', 'abacate fruta', 'avocado fruit'],
  ['🥕', 'cenoura legume', 'carrot vegetable'],
  ['🥦', 'brocolis legume', 'broccoli vegetable'],
  ['🌽', 'milho legume', 'corn vegetable'],
  ['🛒', 'mercado compras carrinho', 'grocery shopping cart'],
  ['🧺', 'feira cesta compras', 'basket market shopping'],
  ['🍰', 'bolo doce sobremesa', 'cake dessert sweet'],
  ['🎂', 'aniversario bolo festa', 'birthday cake party'],
  ['🍪', 'biscoito doce', 'cookie sweet'],
  ['🍫', 'chocolate doce', 'chocolate sweet'],
  ['🍦', 'sorvete doce', 'ice cream sweet'],
  ['🍩', 'rosquinha doce', 'donut sweet'],
  ['🍿', 'pipoca cinema', 'popcorn cinema'],
  ['☕', 'cafe cafeteria bebida', 'coffee cafe drink'],
  ['🧉', 'chimarrao erva bebida', 'mate drink'],
  ['🍺', 'cerveja bar bebida', 'beer bar drink'],
  ['🍻', 'bar happy hour cerveja', 'bar happy hour beer'],
  ['🍷', 'vinho bebida', 'wine drink'],
  ['🍸', 'drink coquetel bar', 'cocktail drink bar'],
  ['🥤', 'refrigerante bebida', 'soda drink'],
  ['🧃', 'suco bebida caixinha', 'juice box drink'],
  ['💧', 'agua bebida conta', 'water drink bill'],

  // Transporte
  ['🚗', 'carro transporte', 'car transport'],
  ['🚙', 'carro suv transporte', 'suv car transport'],
  ['🚕', 'taxi uber corrida', 'taxi ride cab'],
  ['🚌', 'onibus transporte publico', 'bus public transport'],
  ['🚇', 'metro transporte publico', 'subway metro transport'],
  ['🚆', 'trem transporte', 'train transport'],
  ['✈️', 'aviao viagem voo', 'plane travel flight'],
  ['🛵', 'moto scooter delivery', 'scooter moped delivery'],
  ['🏍️', 'moto motocicleta', 'motorcycle bike'],
  ['🚲', 'bicicleta bike', 'bicycle bike'],
  ['🛴', 'patinete mobilidade', 'kick scooter mobility'],
  ['⛽', 'combustivel gasolina posto', 'fuel gas station'],
  ['🅿️', 'estacionamento vaga', 'parking spot'],
  ['🛣️', 'pedagio estrada', 'toll road highway'],
  ['🔧', 'manutencao oficina mecanico', 'maintenance repair mechanic'],
  ['🚢', 'barco navio viagem', 'ship boat travel'],
  ['🚁', 'helicoptero viagem', 'helicopter travel'],

  // Casa e contas
  ['🏠', 'casa moradia lar', 'house home'],
  ['🏡', 'casa jardim moradia', 'house garden home'],
  ['🏢', 'predio apartamento escritorio', 'building apartment office'],
  ['🔑', 'aluguel chave imovel', 'rent key property'],
  ['💡', 'luz energia conta', 'light energy bill'],
  ['⚡', 'energia eletrica conta', 'power electricity bill'],
  ['🔥', 'gas botijao conta', 'gas bill'],
  ['🚿', 'agua chuveiro conta', 'water shower bill'],
  ['🧹', 'limpeza faxina casa', 'cleaning house chores'],
  ['🧼', 'limpeza sabao higiene', 'soap cleaning hygiene'],
  ['🛋️', 'movel sofa casa', 'furniture sofa home'],
  ['🛏️', 'cama quarto movel', 'bed bedroom furniture'],
  ['🪑', 'cadeira movel casa', 'chair furniture home'],
  ['🚪', 'porta reforma casa', 'door renovation home'],
  ['🔨', 'reforma obra ferramenta', 'renovation tools repair'],
  ['🪴', 'planta decoracao casa', 'plant decor home'],
  ['📶', 'internet wifi conta', 'internet wifi bill'],
  ['📱', 'celular telefone conta', 'phone cellphone bill'],
  ['📺', 'tv streaming assinatura', 'tv streaming subscription'],

  // Dinheiro e finanças
  ['💰', 'dinheiro grana economia', 'money cash savings'],
  ['💵', 'dinheiro nota pagamento', 'cash bill payment'],
  ['💳', 'cartao credito fatura', 'card credit bill'],
  ['🏦', 'banco tarifa conta', 'bank fee account'],
  ['🐷', 'poupanca cofrinho economia', 'savings piggy bank'],
  ['📈', 'investimento alta grafico', 'investment growth chart'],
  ['📉', 'prejuizo queda grafico', 'loss drop chart'],
  ['📊', 'relatorio grafico analise', 'report chart analysis'],
  ['🧾', 'recibo nota cupom', 'receipt invoice bill'],
  ['🧮', 'calculo imposto conta', 'calculation tax accounting'],
  ['💸', 'gasto saida dinheiro', 'expense spending money'],
  ['🤝', 'emprestimo acordo negocio', 'loan deal business'],
  ['🎁', 'presente doacao', 'gift present donation'],
  ['❤️', 'doacao caridade ajuda', 'donation charity help'],
  ['⛪', 'igreja dizimo religiao', 'church tithe religion'],

  // Trabalho e educação
  ['💼', 'trabalho negocio profissional', 'work business professional'],
  ['🧑‍💻', 'trabalho freela dev', 'work freelance dev'],
  ['🖥️', 'computador equipamento trabalho', 'computer equipment work'],
  ['💻', 'notebook computador trabalho', 'laptop computer work'],
  ['⌨️', 'teclado equipamento', 'keyboard equipment'],
  ['🖨️', 'impressao impressora escritorio', 'printing printer office'],
  ['📚', 'livro estudo educacao', 'books study education'],
  ['📖', 'livro leitura', 'book reading'],
  ['🎓', 'faculdade curso formatura', 'college course graduation'],
  ['✏️', 'material escolar papelaria', 'school supplies stationery'],
  ['📝', 'curso prova anotacao', 'course exam notes'],
  ['🗂️', 'documento arquivo organizacao', 'document file organization'],
  ['📅', 'agenda mensalidade data', 'calendar monthly date'],
  ['⏰', 'prazo lembrete hora', 'deadline reminder time'],

  // Saúde e cuidados
  ['💊', 'remedio farmacia medicamento', 'medicine pharmacy drug'],
  ['💉', 'vacina injecao exame', 'vaccine shot exam'],
  ['🩺', 'consulta medico saude', 'checkup doctor health'],
  ['🏥', 'hospital saude emergencia', 'hospital health emergency'],
  ['🦷', 'dentista dente odonto', 'dentist tooth dental'],
  ['👓', 'oculos otica visao', 'glasses optician vision'],
  ['🧠', 'terapia psicologo mente', 'therapy psychologist mind'],
  ['🧘', 'yoga bem-estar meditacao', 'yoga wellness meditation'],
  ['💪', 'academia treino musculacao', 'gym workout fitness'],
  ['🏃', 'corrida treino esporte', 'running workout sport'],
  ['💇', 'cabelo salao corte', 'hair salon haircut'],
  ['💅', 'unha manicure beleza', 'nails manicure beauty'],
  ['💄', 'maquiagem beleza cosmetico', 'makeup beauty cosmetics'],
  ['🧴', 'cosmetico skincare higiene', 'cosmetics skincare hygiene'],
  ['🛁', 'banho higiene cuidado', 'bath hygiene care'],

  // Lazer e cultura
  ['🎬', 'cinema filme', 'cinema movie'],
  ['🎮', 'game jogo videogame', 'game gaming videogame'],
  ['🕹️', 'game arcade jogo', 'arcade game'],
  ['🎧', 'musica fone streaming', 'music headphones streaming'],
  ['🎵', 'musica assinatura', 'music subscription'],
  ['🎤', 'karaoke show musica', 'karaoke show music'],
  ['🎸', 'instrumento musica hobby', 'guitar music hobby'],
  ['🎨', 'arte hobby pintura', 'art hobby painting'],
  ['🎭', 'teatro espetaculo cultura', 'theater show culture'],
  ['🎟️', 'ingresso evento show', 'ticket event show'],
  ['🎉', 'festa comemoracao evento', 'party celebration event'],
  ['🍾', 'comemoracao festa bebida', 'celebration party drink'],
  ['⚽', 'futebol esporte', 'soccer football sport'],
  ['🏀', 'basquete esporte', 'basketball sport'],
  ['🎾', 'tenis esporte', 'tennis sport'],
  ['🏊', 'natacao piscina esporte', 'swimming pool sport'],
  ['⛷️', 'esqui neve viagem', 'ski snow travel'],
  ['🏕️', 'camping acampamento', 'camping tent'],
  ['🏖️', 'praia ferias viagem', 'beach vacation travel'],
  ['🗺️', 'viagem mapa passeio', 'travel map trip'],
  ['🧳', 'viagem mala bagagem', 'travel luggage baggage'],
  ['🏨', 'hotel hospedagem viagem', 'hotel lodging travel'],

  // Compras e serviços
  ['🛍️', 'compras loja shopping', 'shopping store bags'],
  ['👕', 'roupa vestuario moda', 'clothes apparel fashion'],
  ['👟', 'tenis calcado', 'sneakers shoes'],
  ['👠', 'sapato calcado moda', 'shoes heels fashion'],
  ['👜', 'bolsa acessorio moda', 'bag accessory fashion'],
  ['⌚', 'relogio acessorio', 'watch accessory'],
  ['💍', 'joia presente', 'jewelry ring gift'],
  ['📦', 'encomenda entrega pacote', 'package delivery parcel'],
  ['🚚', 'frete entrega mudanca', 'shipping delivery moving'],
  ['🧰', 'ferramenta servico reparo', 'tools service repair'],
  ['🪒', 'barbear higiene', 'shaving razor hygiene'],

  // Pets, família e pessoas
  ['🐶', 'cachorro pet', 'dog pet'],
  ['🐱', 'gato pet', 'cat pet'],
  ['🐾', 'pet animal', 'pet animal paw'],
  ['🐦', 'passaro pet', 'bird pet'],
  ['🐠', 'aquario peixe pet', 'aquarium fish pet'],
  ['🦴', 'racao pet osso', 'pet food bone'],
  ['👶', 'bebe filho crianca', 'baby child kid'],
  ['👨‍👩‍👧', 'familia filhos', 'family kids'],
  ['🧑‍🦳', 'idoso avo cuidado', 'elderly senior care'],
  ['🎒', 'escola crianca material', 'school kid supplies'],

  // Tecnologia e assinaturas
  ['☁️', 'nuvem cloud servidor', 'cloud server hosting'],
  ['🗄️', 'servidor arquivo armazenamento', 'server file storage'],
  ['🔒', 'seguranca senha vpn', 'security password vpn'],
  ['🤖', 'ia bot automacao', 'ai bot automation'],
  ['🔌', 'energia equipamento', 'power plug equipment'],
  ['🔋', 'bateria carga', 'battery charge'],
  ['📷', 'foto camera hobby', 'photo camera hobby'],
  ['🛰️', 'satelite internet sinal', 'satellite internet signal'],
  ['🌐', 'site dominio internet', 'website domain internet'],
  ['💾', 'backup armazenamento', 'backup storage'],

  // Símbolos e diversos
  ['⭐', 'favorito especial', 'favorite special star'],
  ['🔖', 'etiqueta categoria', 'tag label category'],
  ['📌', 'fixado importante', 'pinned important'],
  ['❓', 'outros diversos duvida', 'other misc unknown'],
  ['♻️', 'reciclagem sustentavel', 'recycling sustainable'],
  ['🌱', 'planta natureza jardim', 'plant nature garden'],
  ['☂️', 'seguro imprevisto protecao', 'insurance unexpected protection'],
  ['🛡️', 'seguro protecao', 'insurance protection shield'],
  ['⚖️', 'juridico advogado imposto', 'legal lawyer tax'],
  ['🏛️', 'imposto governo taxa', 'tax government fee'],
  ['🎯', 'meta objetivo limite', 'goal target limit'],
  ['🔁', 'recorrente assinatura mensal', 'recurring subscription monthly'],
];

export const EMOJI_CATALOG: EmojiEntry[] = raw.map(([char, pt, en]) => ({
  char,
  keywords: pt.split(' '),
  en: en.split(' '),
}));

/** Prefixo que marca um ícone como emoji na coluna `categories.icon`. */
export const EMOJI_PREFIX = 'emoji:';

export const isEmojiIcon = (icon: string) => icon.startsWith(EMOJI_PREFIX);
export const emojiChar = (icon: string) => icon.slice(EMOJI_PREFIX.length);
export const toEmojiIcon = (char: string) => EMOJI_PREFIX + char;

/**
 * Aceita qualquer coisa que o teclado de emoji produza, inclusive sequências
 * com modificador de tom de pele ou ZWJ (👨‍👩‍👧). O que não pode é texto comum
 * virar "ícone", então exige ao menos um caractere fora do ASCII.
 */
export function looksLikeEmoji(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 12) return false;
  // Exige ao menos um caractere fora do ASCII: texto comum não vira ícone.
  return [...t].some((ch) => (ch.codePointAt(0) ?? 0) > 0x7f);
}

/** Busca emojis por palavra-chave nos dois idiomas. */
export function searchEmojis(query: string, normalize: (t: string) => string): EmojiEntry[] {
  const q = normalize(query.trim());
  if (!q) return EMOJI_CATALOG;
  return EMOJI_CATALOG.filter(
    (e) =>
      e.char === query.trim() ||
      e.keywords.some((k) => normalize(k).includes(q)) ||
      e.en.some((k) => normalize(k).includes(q))
  );
}
