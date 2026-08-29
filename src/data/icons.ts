import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_ICONS } from './brandIcons';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Nome de ícone do app: glyph do MaterialCommunityIcons ou "brand:<marca>". */
export type AppIconName = string;

export type CatalogIcon = {
  name: AppIconName;
  /** Palavras-chave em pt-BR para a busca de ícones. */
  keywords: string[];
  /**
   * Palavras-chave em inglês. A busca olha as duas listas sempre: quem usa o
   * app em inglês pode digitar "food", e quem usa em português, "comida".
   */
  en?: string[];
};

/** Logos de marcas (serviços de assinatura) disponíveis no seletor de ícones. */
export const BRAND_CATALOG: CatalogIcon[] = [
  { name: 'brand:netflix', keywords: ['netflix', 'streaming', 'assinatura', 'filme'], en: ['subscription', 'movie'] },
  { name: 'brand:spotify', keywords: ['spotify', 'música', 'assinatura', 'podcast'], en: ['music', 'subscription'] },
  { name: 'brand:youtube', keywords: ['youtube', 'premium', 'streaming', 'vídeo'], en: ['video'] },
  { name: 'brand:youtubemusic', keywords: ['youtube music', 'música', 'streaming'], en: ['music'] },
  { name: 'brand:applemusic', keywords: ['apple music', 'música', 'streaming'], en: ['music'] },
  { name: 'brand:icloud', keywords: ['icloud', 'apple', 'nuvem', 'armazenamento'], en: ['cloud', 'storage'] },
  { name: 'brand:apple', keywords: ['apple', 'apple one', 'tv', 'assinatura'], en: ['subscription'] },
  { name: 'brand:googleplay', keywords: ['google play', 'google', 'assinatura', 'apps'], en: ['subscription'] },
  { name: 'brand:google', keywords: ['google', 'google one', 'workspace', 'nuvem'], en: ['cloud'] },
  { name: 'brand:uber', keywords: ['uber', 'corrida', 'transporte'], en: ['ride', 'transport'] },
  { name: 'brand:ubereats', keywords: ['uber eats', 'delivery', 'comida'], en: ['food'] },
  { name: 'brand:ifood', keywords: ['ifood', 'delivery', 'comida', 'restaurante'], en: ['food', 'restaurant'] },
  { name: 'brand:hbomax', keywords: ['hbo max', 'max', 'streaming', 'filme'], en: ['movie'] },
  { name: 'brand:max', keywords: ['max', 'hbo', 'streaming'] },
  { name: 'brand:paramountplus', keywords: ['paramount', 'streaming', 'filme'], en: ['movie'] },
  { name: 'brand:deezer', keywords: ['deezer', 'música', 'streaming'], en: ['music'] },
  { name: 'brand:playstation', keywords: ['playstation', 'plus', 'games', 'jogos'], en: ['games'] },
  { name: 'brand:crunchyroll', keywords: ['crunchyroll', 'anime', 'streaming'] },
  { name: 'brand:twitch', keywords: ['twitch', 'streaming', 'games'] },
  { name: 'brand:dropbox', keywords: ['dropbox', 'nuvem', 'armazenamento'], en: ['cloud', 'storage'] },
];

/**
 * Catálogo curado de ícones para categorias.
 * Combina logos de marcas e ícones do MaterialCommunityIcons.
 */
export const ICON_CATALOG: CatalogIcon[] = [
  ...BRAND_CATALOG,
  // Alimentação
  { name: 'silverware-fork-knife', keywords: ['comida', 'restaurante', 'almoço', 'jantar', 'alimentação'], en: ['food', 'restaurant', 'lunch', 'dinner'] },
  { name: 'food', keywords: ['comida', 'lanche', 'fast food'], en: ['food', 'snack'] },
  { name: 'hamburger', keywords: ['hambúrguer', 'lanche', 'fast food'], en: ['burger', 'snack'] },
  { name: 'pizza', keywords: ['pizza', 'comida'], en: ['food'] },
  { name: 'coffee', keywords: ['café', 'cafeteria', 'bebida'], en: ['coffee', 'cafe', 'drink'] },
  { name: 'cup', keywords: ['bebida', 'copo', 'suco'], en: ['drink', 'cup', 'juice'] },
  { name: 'beer', keywords: ['cerveja', 'bar', 'bebida', 'álcool'], en: ['beer', 'drink', 'alcohol'] },
  { name: 'cart', keywords: ['mercado', 'supermercado', 'compras', 'feira'], en: ['grocery', 'supermarket', 'shopping', 'market'] },
  { name: 'cart-outline', keywords: ['compras', 'carrinho'], en: ['shopping', 'cart'] },
  { name: 'basket', keywords: ['feira', 'compras', 'mercado'], en: ['market', 'shopping', 'grocery'] },
  { name: 'cupcake', keywords: ['doce', 'sobremesa', 'padaria'], en: ['sweets', 'dessert', 'bakery'] },
  { name: 'bread-slice', keywords: ['pão', 'padaria'], en: ['bread', 'bakery'] },
  { name: 'ice-cream', keywords: ['sorvete', 'doce'], en: ['ice cream', 'sweets'] },
  { name: 'noodles', keywords: ['comida', 'massa', 'restaurante'], en: ['food', 'pasta', 'restaurant'] },

  // Transporte
  { name: 'car', keywords: ['carro', 'transporte', 'automóvel'], en: ['car', 'transport', 'automobile'] },
  { name: 'car-hatchback', keywords: ['carro', 'transporte'], en: ['car', 'transport'] },
  { name: 'gas-station', keywords: ['gasolina', 'combustível', 'posto'], en: ['gas', 'fuel', 'gas station'] },
  { name: 'bus', keywords: ['ônibus', 'transporte público'], en: ['bus', 'public transport'] },
  { name: 'train', keywords: ['trem', 'metrô', 'transporte'], en: ['train', 'subway', 'transport'] },
  { name: 'subway-variant', keywords: ['metrô', 'transporte'], en: ['subway', 'transport'] },
  { name: 'taxi', keywords: ['táxi', 'uber', 'corrida'], en: ['taxi', 'ride'] },
  { name: 'motorbike', keywords: ['moto', 'motocicleta'], en: ['motorcycle', 'motorbike'] },
  { name: 'bicycle', keywords: ['bicicleta', 'bike'], en: ['bicycle'] },
  { name: 'airplane', keywords: ['avião', 'viagem', 'voo'], en: ['plane', 'travel', 'flight'] },
  { name: 'parking', keywords: ['estacionamento', 'parking'], en: ['parking'] },
  { name: 'car-wrench', keywords: ['oficina', 'mecânico', 'manutenção', 'carro'], en: ['workshop', 'mechanic', 'maintenance', 'car'] },
  { name: 'highway', keywords: ['pedágio', 'estrada'], en: ['toll', 'road'] },

  // Casa
  { name: 'home', keywords: ['casa', 'moradia', 'lar'], en: ['home', 'housing'] },
  { name: 'home-city', keywords: ['aluguel', 'apartamento', 'moradia'], en: ['rent', 'apartment', 'housing'] },
  { name: 'sofa', keywords: ['móveis', 'casa', 'sofá'], en: ['furniture', 'home', 'sofa'] },
  { name: 'bed', keywords: ['cama', 'móveis', 'quarto'], en: ['bed', 'furniture', 'bedroom'] },
  { name: 'lightbulb', keywords: ['luz', 'energia', 'conta de luz'], en: ['light', 'power', 'electricity bill'] },
  { name: 'flash', keywords: ['energia', 'luz', 'elétrica'], en: ['power', 'light', 'electric'] },
  { name: 'water', keywords: ['água', 'conta de água'], en: ['water', 'water bill'] },
  { name: 'fire', keywords: ['gás', 'fogo'], en: ['gas', 'fire'] },
  { name: 'broom', keywords: ['limpeza', 'faxina', 'casa'], en: ['cleaning', 'home'] },
  { name: 'tools', keywords: ['reforma', 'reparo', 'manutenção'], en: ['renovation', 'repair', 'maintenance'] },
  { name: 'hammer-wrench', keywords: ['reforma', 'construção', 'reparo'], en: ['renovation', 'construction', 'repair'] },
  { name: 'wifi', keywords: ['internet', 'wifi', 'rede'], en: ['network'] },

  // Contas e finanças
  { name: 'file-document', keywords: ['conta', 'boleto', 'documento'], en: ['bill', 'document'] },
  { name: 'cash', keywords: ['dinheiro', 'pagamento'], en: ['cash', 'payment'] },
  { name: 'credit-card', keywords: ['cartão', 'crédito', 'fatura'], en: ['card', 'credit', 'invoice'] },
  { name: 'bank', keywords: ['banco', 'tarifa', 'financeiro'], en: ['bank', 'fee', 'finance'] },
  { name: 'percent', keywords: ['juros', 'imposto', 'taxa'], en: ['interest', 'tax', 'fee'] },
  { name: 'chart-line', keywords: ['investimento', 'gráfico'], en: ['investment', 'chart'] },
  { name: 'piggy-bank', keywords: ['poupança', 'economia', 'cofrinho'], en: ['savings', 'piggy bank'] },
  { name: 'receipt', keywords: ['recibo', 'nota', 'conta'], en: ['receipt', 'bill'] },
  { name: 'scale-balance', keywords: ['imposto', 'jurídico', 'taxa'], en: ['tax', 'legal', 'fee'] },

  // Saúde
  { name: 'heart-pulse', keywords: ['saúde', 'médico', 'plano'], en: ['health', 'doctor', 'plan'] },
  { name: 'medical-bag', keywords: ['saúde', 'médico', 'consulta'], en: ['health', 'doctor', 'appointment'] },
  { name: 'pill', keywords: ['remédio', 'farmácia', 'medicamento'], en: ['medication', 'pharmacy', 'medicine'] },
  { name: 'hospital-box', keywords: ['hospital', 'saúde', 'emergência'], en: ['health', 'emergency'] },
  { name: 'tooth', keywords: ['dentista', 'dente', 'odonto'], en: ['dentist', 'tooth', 'dental'] },
  { name: 'glasses', keywords: ['óculos', 'ótica', 'oftalmo'], en: ['glasses', 'optician', 'optometry'] },
  { name: 'dumbbell', keywords: ['academia', 'fitness', 'exercício', 'musculação'], en: ['gym', 'exercise', 'weights'] },
  { name: 'meditation', keywords: ['yoga', 'bem-estar', 'terapia'], en: ['wellness', 'therapy'] },
  { name: 'human-male-female', keywords: ['terapia', 'psicólogo', 'consulta'], en: ['therapy', 'psychologist', 'appointment'] },

  // Lazer / entretenimento
  { name: 'movie-open', keywords: ['cinema', 'filme', 'lazer'], en: ['movie', 'leisure'] },
  { name: 'television-classic', keywords: ['streaming', 'tv', 'netflix'] },
  { name: 'music', keywords: ['música', 'spotify', 'show'], en: ['music', 'concert'] },
  { name: 'gamepad-variant', keywords: ['games', 'jogos', 'videogame'], en: ['games', 'video game'] },
  { name: 'controller-classic', keywords: ['games', 'jogos', 'console'], en: ['games'] },
  { name: 'ticket', keywords: ['ingresso', 'evento', 'show'], en: ['ticket', 'event', 'concert'] },
  { name: 'party-popper', keywords: ['festa', 'evento', 'comemoração'], en: ['party', 'event', 'celebration'] },
  { name: 'book-open-variant', keywords: ['livro', 'leitura', 'educação'], en: ['book', 'reading', 'education'] },
  { name: 'palette', keywords: ['arte', 'hobby', 'pintura'], en: ['art', 'painting'] },
  { name: 'guitar-acoustic', keywords: ['música', 'instrumento', 'hobby'], en: ['music', 'instrument'] },
  { name: 'beach', keywords: ['viagem', 'praia', 'férias'], en: ['travel', 'beach', 'vacation'] },
  { name: 'camera', keywords: ['foto', 'câmera', 'hobby'], en: ['photo', 'camera'] },

  // Compras / vestuário
  { name: 'tshirt-crew', keywords: ['roupa', 'vestuário', 'moda'], en: ['clothes', 'apparel', 'fashion'] },
  { name: 'shoe-heel', keywords: ['sapato', 'calçado', 'moda'], en: ['shoe', 'footwear', 'fashion'] },
  { name: 'shoe-sneaker', keywords: ['tênis', 'calçado'], en: ['sneakers', 'footwear'] },
  { name: 'shopping', keywords: ['compras', 'loja', 'shopping'], en: ['shopping', 'store'] },
  { name: 'hanger', keywords: ['roupa', 'moda', 'vestuário'], en: ['clothes', 'fashion', 'apparel'] },
  { name: 'watch', keywords: ['relógio', 'acessório'], en: ['watch', 'accessory'] },
  { name: 'ring', keywords: ['joia', 'presente', 'acessório'], en: ['jewelry', 'gift', 'accessory'] },
  { name: 'bag-personal', keywords: ['bolsa', 'acessório', 'moda'], en: ['handbag', 'accessory', 'fashion'] },

  // Tecnologia
  { name: 'cellphone', keywords: ['celular', 'telefone', 'smartphone'], en: ['cellphone', 'phone'] },
  { name: 'laptop', keywords: ['notebook', 'computador', 'tecnologia'], en: ['laptop', 'computer', 'technology'] },
  { name: 'headphones', keywords: ['fone', 'áudio', 'eletrônico'], en: ['headphones', 'audio', 'electronics'] },
  { name: 'application', keywords: ['app', 'assinatura', 'software'], en: ['subscription'] },
  { name: 'cloud', keywords: ['nuvem', 'assinatura', 'armazenamento'], en: ['cloud', 'subscription', 'storage'] },

  // Educação
  { name: 'school', keywords: ['escola', 'faculdade', 'educação'], en: ['school', 'college', 'education'] },
  { name: 'book-education', keywords: ['curso', 'estudo', 'educação'], en: ['course', 'study', 'education'] },
  { name: 'pencil', keywords: ['material', 'escola', 'papelaria'], en: ['supplies', 'school', 'stationery'] },
  { name: 'certificate', keywords: ['curso', 'certificado', 'educação'], en: ['course', 'certificate', 'education'] },

  // Família / pets / pessoas
  { name: 'baby-carriage', keywords: ['bebê', 'filho', 'criança'], en: ['baby', 'kid', 'child'] },
  { name: 'paw', keywords: ['pet', 'animal', 'cachorro', 'gato'], en: ['dog', 'cat'] },
  { name: 'dog', keywords: ['cachorro', 'pet', 'animal'], en: ['dog'] },
  { name: 'cat', keywords: ['gato', 'pet', 'animal'], en: ['cat'] },
  { name: 'gift', keywords: ['presente', 'aniversário'], en: ['gift', 'birthday'] },
  { name: 'human-greeting', keywords: ['doação', 'pessoas', 'ajuda'], en: ['donation', 'people', 'help'] },
  { name: 'hand-heart', keywords: ['doação', 'caridade'], en: ['donation', 'charity'] },

  // Beleza / cuidados
  { name: 'content-cut', keywords: ['cabelo', 'salão', 'barbeiro'], en: ['hair', 'salon', 'barber'] },
  { name: 'spray', keywords: ['perfume', 'beleza', 'cosmético'], en: ['beauty', 'cosmetics'] },
  { name: 'lipstick', keywords: ['maquiagem', 'beleza'], en: ['makeup', 'beauty'] },
  { name: 'face-woman-shimmer', keywords: ['estética', 'beleza', 'skincare'], en: ['aesthetics', 'beauty'] },

  // Trabalho / outros
  { name: 'briefcase', keywords: ['trabalho', 'negócio', 'profissional'], en: ['work', 'business', 'professional'] },
  { name: 'printer', keywords: ['impressão', 'escritório'], en: ['printing', 'office'] },
  { name: 'dots-horizontal', keywords: ['outros', 'diversos', 'geral'], en: ['other', 'miscellaneous', 'general'] },
  { name: 'tag', keywords: ['geral', 'etiqueta', 'outros'], en: ['general', 'tag', 'other'] },
  { name: 'star', keywords: ['favorito', 'especial'], en: ['favorite', 'special'] },
  { name: 'shield-check', keywords: ['seguro', 'proteção'], en: ['insurance', 'protection'] },
  { name: 'umbrella', keywords: ['seguro', 'proteção', 'guarda-chuva'], en: ['insurance', 'protection', 'umbrella'] },
];

/** Busca ícones por nome ou palavra-chave (sem acento, case-insensitive). */
export function searchIcons(query: string): CatalogIcon[] {
  const q = normalize(query.trim());
  if (!q) return ICON_CATALOG;
  return ICON_CATALOG.filter((icon) => {
    if (normalize(icon.name).includes(q)) return true;
    if (icon.keywords.some((k) => normalize(k).includes(q))) return true;
    return (icon.en ?? []).some((k) => normalize(k).includes(q));
  });
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
