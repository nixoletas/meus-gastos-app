import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_ICONS } from './brandIcons';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Nome de ícone do app: glyph do MaterialCommunityIcons ou "brand:<marca>". */
export type AppIconName = string;

export type CatalogIcon = {
  name: AppIconName;
  /** Palavras-chave em pt-BR para a busca de ícones. */
  keywords: string[];
};

/** Logos de marcas (serviços de assinatura) disponíveis no seletor de ícones. */
export const BRAND_CATALOG: CatalogIcon[] = [
  { name: 'brand:netflix', keywords: ['netflix', 'streaming', 'assinatura', 'filme'] },
  { name: 'brand:spotify', keywords: ['spotify', 'música', 'assinatura', 'podcast'] },
  { name: 'brand:youtube', keywords: ['youtube', 'premium', 'streaming', 'vídeo'] },
  { name: 'brand:youtubemusic', keywords: ['youtube music', 'música', 'streaming'] },
  { name: 'brand:applemusic', keywords: ['apple music', 'música', 'streaming'] },
  { name: 'brand:icloud', keywords: ['icloud', 'apple', 'nuvem', 'armazenamento'] },
  { name: 'brand:apple', keywords: ['apple', 'apple one', 'tv', 'assinatura'] },
  { name: 'brand:googleplay', keywords: ['google play', 'google', 'assinatura', 'apps'] },
  { name: 'brand:google', keywords: ['google', 'google one', 'workspace', 'nuvem'] },
  { name: 'brand:uber', keywords: ['uber', 'corrida', 'transporte'] },
  { name: 'brand:ubereats', keywords: ['uber eats', 'delivery', 'comida'] },
  { name: 'brand:ifood', keywords: ['ifood', 'delivery', 'comida', 'restaurante'] },
  { name: 'brand:hbomax', keywords: ['hbo max', 'max', 'streaming', 'filme'] },
  { name: 'brand:max', keywords: ['max', 'hbo', 'streaming'] },
  { name: 'brand:paramountplus', keywords: ['paramount', 'streaming', 'filme'] },
  { name: 'brand:deezer', keywords: ['deezer', 'música', 'streaming'] },
  { name: 'brand:playstation', keywords: ['playstation', 'plus', 'games', 'jogos'] },
  { name: 'brand:crunchyroll', keywords: ['crunchyroll', 'anime', 'streaming'] },
  { name: 'brand:twitch', keywords: ['twitch', 'streaming', 'games'] },
  { name: 'brand:dropbox', keywords: ['dropbox', 'nuvem', 'armazenamento'] },
];

/**
 * Catálogo curado de ícones para categorias.
 * Combina logos de marcas e ícones do MaterialCommunityIcons.
 */
export const ICON_CATALOG: CatalogIcon[] = [
  ...BRAND_CATALOG,
  // Alimentação
  { name: 'silverware-fork-knife', keywords: ['comida', 'restaurante', 'almoço', 'jantar', 'alimentação'] },
  { name: 'food', keywords: ['comida', 'lanche', 'fast food'] },
  { name: 'hamburger', keywords: ['hambúrguer', 'lanche', 'fast food'] },
  { name: 'pizza', keywords: ['pizza', 'comida'] },
  { name: 'coffee', keywords: ['café', 'cafeteria', 'bebida'] },
  { name: 'cup', keywords: ['bebida', 'copo', 'suco'] },
  { name: 'beer', keywords: ['cerveja', 'bar', 'bebida', 'álcool'] },
  { name: 'cart', keywords: ['mercado', 'supermercado', 'compras', 'feira'] },
  { name: 'cart-outline', keywords: ['compras', 'carrinho'] },
  { name: 'basket', keywords: ['feira', 'compras', 'mercado'] },
  { name: 'cupcake', keywords: ['doce', 'sobremesa', 'padaria'] },
  { name: 'bread-slice', keywords: ['pão', 'padaria'] },
  { name: 'ice-cream', keywords: ['sorvete', 'doce'] },
  { name: 'noodles', keywords: ['comida', 'massa', 'restaurante'] },

  // Transporte
  { name: 'car', keywords: ['carro', 'transporte', 'automóvel'] },
  { name: 'car-hatchback', keywords: ['carro', 'transporte'] },
  { name: 'gas-station', keywords: ['gasolina', 'combustível', 'posto'] },
  { name: 'bus', keywords: ['ônibus', 'transporte público'] },
  { name: 'train', keywords: ['trem', 'metrô', 'transporte'] },
  { name: 'subway-variant', keywords: ['metrô', 'transporte'] },
  { name: 'taxi', keywords: ['táxi', 'uber', 'corrida'] },
  { name: 'motorbike', keywords: ['moto', 'motocicleta'] },
  { name: 'bicycle', keywords: ['bicicleta', 'bike'] },
  { name: 'airplane', keywords: ['avião', 'viagem', 'voo'] },
  { name: 'parking', keywords: ['estacionamento', 'parking'] },
  { name: 'car-wrench', keywords: ['oficina', 'mecânico', 'manutenção', 'carro'] },
  { name: 'highway', keywords: ['pedágio', 'estrada'] },

  // Casa
  { name: 'home', keywords: ['casa', 'moradia', 'lar'] },
  { name: 'home-city', keywords: ['aluguel', 'apartamento', 'moradia'] },
  { name: 'sofa', keywords: ['móveis', 'casa', 'sofá'] },
  { name: 'bed', keywords: ['cama', 'móveis', 'quarto'] },
  { name: 'lightbulb', keywords: ['luz', 'energia', 'conta de luz'] },
  { name: 'flash', keywords: ['energia', 'luz', 'elétrica'] },
  { name: 'water', keywords: ['água', 'conta de água'] },
  { name: 'fire', keywords: ['gás', 'fogo'] },
  { name: 'broom', keywords: ['limpeza', 'faxina', 'casa'] },
  { name: 'tools', keywords: ['reforma', 'reparo', 'manutenção'] },
  { name: 'hammer-wrench', keywords: ['reforma', 'construção', 'reparo'] },
  { name: 'wifi', keywords: ['internet', 'wifi', 'rede'] },

  // Contas e finanças
  { name: 'file-document', keywords: ['conta', 'boleto', 'documento'] },
  { name: 'cash', keywords: ['dinheiro', 'pagamento'] },
  { name: 'credit-card', keywords: ['cartão', 'crédito', 'fatura'] },
  { name: 'bank', keywords: ['banco', 'tarifa', 'financeiro'] },
  { name: 'percent', keywords: ['juros', 'imposto', 'taxa'] },
  { name: 'chart-line', keywords: ['investimento', 'gráfico'] },
  { name: 'piggy-bank', keywords: ['poupança', 'economia', 'cofrinho'] },
  { name: 'receipt', keywords: ['recibo', 'nota', 'conta'] },
  { name: 'scale-balance', keywords: ['imposto', 'jurídico', 'taxa'] },

  // Saúde
  { name: 'heart-pulse', keywords: ['saúde', 'médico', 'plano'] },
  { name: 'medical-bag', keywords: ['saúde', 'médico', 'consulta'] },
  { name: 'pill', keywords: ['remédio', 'farmácia', 'medicamento'] },
  { name: 'hospital-box', keywords: ['hospital', 'saúde', 'emergência'] },
  { name: 'tooth', keywords: ['dentista', 'dente', 'odonto'] },
  { name: 'glasses', keywords: ['óculos', 'ótica', 'oftalmo'] },
  { name: 'dumbbell', keywords: ['academia', 'fitness', 'exercício', 'musculação'] },
  { name: 'meditation', keywords: ['yoga', 'bem-estar', 'terapia'] },
  { name: 'human-male-female', keywords: ['terapia', 'psicólogo', 'consulta'] },

  // Lazer / entretenimento
  { name: 'movie-open', keywords: ['cinema', 'filme', 'lazer'] },
  { name: 'television-classic', keywords: ['streaming', 'tv', 'netflix'] },
  { name: 'music', keywords: ['música', 'spotify', 'show'] },
  { name: 'gamepad-variant', keywords: ['games', 'jogos', 'videogame'] },
  { name: 'controller-classic', keywords: ['games', 'jogos', 'console'] },
  { name: 'ticket', keywords: ['ingresso', 'evento', 'show'] },
  { name: 'party-popper', keywords: ['festa', 'evento', 'comemoração'] },
  { name: 'book-open-variant', keywords: ['livro', 'leitura', 'educação'] },
  { name: 'palette', keywords: ['arte', 'hobby', 'pintura'] },
  { name: 'guitar-acoustic', keywords: ['música', 'instrumento', 'hobby'] },
  { name: 'beach', keywords: ['viagem', 'praia', 'férias'] },
  { name: 'camera', keywords: ['foto', 'câmera', 'hobby'] },

  // Compras / vestuário
  { name: 'tshirt-crew', keywords: ['roupa', 'vestuário', 'moda'] },
  { name: 'shoe-heel', keywords: ['sapato', 'calçado', 'moda'] },
  { name: 'shoe-sneaker', keywords: ['tênis', 'calçado'] },
  { name: 'shopping', keywords: ['compras', 'loja', 'shopping'] },
  { name: 'hanger', keywords: ['roupa', 'moda', 'vestuário'] },
  { name: 'watch', keywords: ['relógio', 'acessório'] },
  { name: 'ring', keywords: ['joia', 'presente', 'acessório'] },
  { name: 'bag-personal', keywords: ['bolsa', 'acessório', 'moda'] },

  // Tecnologia
  { name: 'cellphone', keywords: ['celular', 'telefone', 'smartphone'] },
  { name: 'laptop', keywords: ['notebook', 'computador', 'tecnologia'] },
  { name: 'headphones', keywords: ['fone', 'áudio', 'eletrônico'] },
  { name: 'application', keywords: ['app', 'assinatura', 'software'] },
  { name: 'cloud', keywords: ['nuvem', 'assinatura', 'armazenamento'] },

  // Educação
  { name: 'school', keywords: ['escola', 'faculdade', 'educação'] },
  { name: 'book-education', keywords: ['curso', 'estudo', 'educação'] },
  { name: 'pencil', keywords: ['material', 'escola', 'papelaria'] },
  { name: 'certificate', keywords: ['curso', 'certificado', 'educação'] },

  // Família / pets / pessoas
  { name: 'baby-carriage', keywords: ['bebê', 'filho', 'criança'] },
  { name: 'paw', keywords: ['pet', 'animal', 'cachorro', 'gato'] },
  { name: 'dog', keywords: ['cachorro', 'pet', 'animal'] },
  { name: 'cat', keywords: ['gato', 'pet', 'animal'] },
  { name: 'gift', keywords: ['presente', 'aniversário'] },
  { name: 'human-greeting', keywords: ['doação', 'pessoas', 'ajuda'] },
  { name: 'hand-heart', keywords: ['doação', 'caridade'] },

  // Beleza / cuidados
  { name: 'content-cut', keywords: ['cabelo', 'salão', 'barbeiro'] },
  { name: 'spray', keywords: ['perfume', 'beleza', 'cosmético'] },
  { name: 'lipstick', keywords: ['maquiagem', 'beleza'] },
  { name: 'face-woman-shimmer', keywords: ['estética', 'beleza', 'skincare'] },

  // Trabalho / outros
  { name: 'briefcase', keywords: ['trabalho', 'negócio', 'profissional'] },
  { name: 'printer', keywords: ['impressão', 'escritório'] },
  { name: 'dots-horizontal', keywords: ['outros', 'diversos', 'geral'] },
  { name: 'tag', keywords: ['geral', 'etiqueta', 'outros'] },
  { name: 'star', keywords: ['favorito', 'especial'] },
  { name: 'shield-check', keywords: ['seguro', 'proteção'] },
  { name: 'umbrella', keywords: ['seguro', 'proteção', 'guarda-chuva'] },
];

/** Busca ícones por nome ou palavra-chave (sem acento, case-insensitive). */
export function searchIcons(query: string): CatalogIcon[] {
  const q = normalize(query.trim());
  if (!q) return ICON_CATALOG;
  return ICON_CATALOG.filter((icon) => {
    if (normalize(icon.name).includes(q)) return true;
    return icon.keywords.some((k) => normalize(k).includes(q));
  });
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
