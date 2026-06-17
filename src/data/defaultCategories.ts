import { IconName } from './icons';

export type DefaultSubcategory = {
  name: string;
  icon: IconName;
};

export type DefaultCategory = {
  name: string;
  icon: IconName;
  color: string;
  subcategories: DefaultSubcategory[];
};

/**
 * Categorias e subcategorias criadas automaticamente para um novo usuário.
 * Pensadas para o dia a dia brasileiro.
 */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Alimentação',
    icon: 'silverware-fork-knife',
    color: '#F97316',
    subcategories: [
      { name: 'Mercado', icon: 'cart' },
      { name: 'Restaurante', icon: 'food' },
      { name: 'Lanche', icon: 'hamburger' },
      { name: 'Delivery', icon: 'motorbike' },
      { name: 'Café', icon: 'coffee' },
      { name: 'Padaria', icon: 'bread-slice' },
    ],
  },
  {
    name: 'Transporte',
    icon: 'car',
    color: '#3B82F6',
    subcategories: [
      { name: 'Combustível', icon: 'gas-station' },
      { name: 'Uber / Táxi', icon: 'taxi' },
      { name: 'Ônibus / Metrô', icon: 'bus' },
      { name: 'Estacionamento', icon: 'parking' },
      { name: 'Manutenção', icon: 'car-wrench' },
      { name: 'Pedágio', icon: 'highway' },
    ],
  },
  {
    name: 'Moradia',
    icon: 'home',
    color: '#14B8A6',
    subcategories: [
      { name: 'Aluguel', icon: 'home-city' },
      { name: 'Luz', icon: 'lightbulb' },
      { name: 'Água', icon: 'water' },
      { name: 'Gás', icon: 'fire' },
      { name: 'Internet', icon: 'wifi' },
      { name: 'Limpeza', icon: 'broom' },
    ],
  },
  {
    name: 'Saúde',
    icon: 'heart-pulse',
    color: '#EF4444',
    subcategories: [
      { name: 'Farmácia', icon: 'pill' },
      { name: 'Consulta', icon: 'medical-bag' },
      { name: 'Plano de saúde', icon: 'hospital-box' },
      { name: 'Dentista', icon: 'tooth' },
      { name: 'Academia', icon: 'dumbbell' },
      { name: 'Terapia', icon: 'meditation' },
    ],
  },
  {
    name: 'Lazer',
    icon: 'party-popper',
    color: '#EC4899',
    subcategories: [
      { name: 'Streaming', icon: 'television-classic' },
      { name: 'Cinema', icon: 'movie-open' },
      { name: 'Bar', icon: 'beer' },
      { name: 'Games', icon: 'gamepad-variant' },
      { name: 'Viagem', icon: 'airplane' },
      { name: 'Eventos', icon: 'ticket' },
    ],
  },
  {
    name: 'Compras',
    icon: 'shopping',
    color: '#8B5CF6',
    subcategories: [
      { name: 'Roupas', icon: 'tshirt-crew' },
      { name: 'Calçados', icon: 'shoe-sneaker' },
      { name: 'Eletrônicos', icon: 'laptop' },
      { name: 'Casa', icon: 'sofa' },
      { name: 'Presentes', icon: 'gift' },
    ],
  },
  {
    name: 'Educação',
    icon: 'school',
    color: '#6366F1',
    subcategories: [
      { name: 'Cursos', icon: 'certificate' },
      { name: 'Livros', icon: 'book-open-variant' },
      { name: 'Material', icon: 'pencil' },
      { name: 'Mensalidade', icon: 'book-education' },
    ],
  },
  {
    name: 'Contas',
    icon: 'file-document',
    color: '#0EA5A4',
    subcategories: [
      { name: 'Cartão de crédito', icon: 'credit-card' },
      { name: 'Telefone', icon: 'cellphone' },
      { name: 'Assinaturas', icon: 'application' },
      { name: 'Seguros', icon: 'shield-check' },
      { name: 'Tarifas bancárias', icon: 'bank' },
    ],
  },
  {
    name: 'Cuidados',
    icon: 'content-cut',
    color: '#F59E0B',
    subcategories: [
      { name: 'Cabelo', icon: 'content-cut' },
      { name: 'Beleza', icon: 'face-woman-shimmer' },
      { name: 'Cosméticos', icon: 'spray' },
    ],
  },
  {
    name: 'Pets',
    icon: 'paw',
    color: '#84CC16',
    subcategories: [
      { name: 'Ração', icon: 'dog' },
      { name: 'Veterinário', icon: 'medical-bag' },
      { name: 'Banho e tosa', icon: 'content-cut' },
    ],
  },
  {
    name: 'Outros',
    icon: 'dots-horizontal',
    color: '#64748B',
    subcategories: [
      { name: 'Doações', icon: 'hand-heart' },
      { name: 'Imprevistos', icon: 'umbrella' },
      { name: 'Diversos', icon: 'tag' },
    ],
  },
];
