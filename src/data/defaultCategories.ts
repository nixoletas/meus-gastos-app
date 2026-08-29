import { Lang } from '../i18n/active';
import { AppIconName } from './icons';

export type DefaultSubcategory = {
  name: string;
  /** Nome em inglês; usado quando a conta é criada com o app em inglês. */
  nameEn: string;
  icon: AppIconName;
};

export type DefaultCategory = {
  name: string;
  nameEn: string;
  icon: AppIconName;
  color: string;
  subcategories: DefaultSubcategory[];
};

/**
 * Categorias e subcategorias criadas automaticamente para um novo usuário.
 * Pensadas para o dia a dia brasileiro.
 *
 * O nome é gravado no banco na criação da conta, no idioma que estava ativo.
 * Trocar de idioma depois não renomeia o que já é dado do usuário — ele pode
 * editar cada categoria quando quiser.
 */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Alimentação',
    nameEn: 'Food',
    icon: 'silverware-fork-knife',
    color: '#F97316',
    subcategories: [
      { name: 'Mercado', nameEn: 'Groceries', icon: 'cart' },
      { name: 'Restaurante', nameEn: 'Restaurant', icon: 'food' },
      { name: 'Lanche', nameEn: 'Snacks', icon: 'hamburger' },
      { name: 'Delivery', nameEn: 'Delivery', icon: 'motorbike' },
      { name: 'Café', nameEn: 'Coffee', icon: 'coffee' },
      { name: 'Padaria', nameEn: 'Bakery', icon: 'bread-slice' },
    ],
  },
  {
    name: 'Transporte',
    nameEn: 'Transport',
    icon: 'car',
    color: '#3B82F6',
    subcategories: [
      { name: 'Combustível', nameEn: 'Fuel', icon: 'gas-station' },
      { name: 'Uber / Táxi', nameEn: 'Rideshare / Taxi', icon: 'taxi' },
      { name: 'Ônibus / Metrô', nameEn: 'Bus / Subway', icon: 'bus' },
      { name: 'Estacionamento', nameEn: 'Parking', icon: 'parking' },
      { name: 'Manutenção', nameEn: 'Maintenance', icon: 'car-wrench' },
      { name: 'Pedágio', nameEn: 'Tolls', icon: 'highway' },
    ],
  },
  {
    name: 'Moradia',
    nameEn: 'Housing',
    icon: 'home',
    color: '#14B8A6',
    subcategories: [
      { name: 'Aluguel', nameEn: 'Rent', icon: 'home-city' },
      { name: 'Luz', nameEn: 'Electricity', icon: 'lightbulb' },
      { name: 'Água', nameEn: 'Water', icon: 'water' },
      { name: 'Gás', nameEn: 'Gas', icon: 'fire' },
      { name: 'Internet', nameEn: 'Internet', icon: 'wifi' },
      { name: 'Limpeza', nameEn: 'Cleaning', icon: 'broom' },
    ],
  },
  {
    name: 'Saúde',
    nameEn: 'Health',
    icon: 'heart-pulse',
    color: '#EF4444',
    subcategories: [
      { name: 'Farmácia', nameEn: 'Pharmacy', icon: 'pill' },
      { name: 'Consulta', nameEn: 'Doctor visit', icon: 'medical-bag' },
      { name: 'Plano de saúde', nameEn: 'Health insurance', icon: 'hospital-box' },
      { name: 'Dentista', nameEn: 'Dentist', icon: 'tooth' },
      { name: 'Academia', nameEn: 'Gym', icon: 'dumbbell' },
      { name: 'Terapia', nameEn: 'Therapy', icon: 'meditation' },
    ],
  },
  {
    name: 'Lazer',
    nameEn: 'Leisure',
    icon: 'party-popper',
    color: '#EC4899',
    subcategories: [
      { name: 'Streaming', nameEn: 'Streaming', icon: 'television-classic' },
      { name: 'Cinema', nameEn: 'Movies', icon: 'movie-open' },
      { name: 'Bar', nameEn: 'Bar', icon: 'beer' },
      { name: 'Games', nameEn: 'Games', icon: 'gamepad-variant' },
      { name: 'Viagem', nameEn: 'Travel', icon: 'airplane' },
      { name: 'Eventos', nameEn: 'Events', icon: 'ticket' },
    ],
  },
  {
    name: 'Compras',
    nameEn: 'Shopping',
    icon: 'shopping',
    color: '#8B5CF6',
    subcategories: [
      { name: 'Roupas', nameEn: 'Clothing', icon: 'tshirt-crew' },
      { name: 'Calçados', nameEn: 'Shoes', icon: 'shoe-sneaker' },
      { name: 'Eletrônicos', nameEn: 'Electronics', icon: 'laptop' },
      { name: 'Casa', nameEn: 'Home', icon: 'sofa' },
      { name: 'Presentes', nameEn: 'Gifts', icon: 'gift' },
    ],
  },
  {
    name: 'Educação',
    nameEn: 'Education',
    icon: 'school',
    color: '#6366F1',
    subcategories: [
      { name: 'Cursos', nameEn: 'Courses', icon: 'certificate' },
      { name: 'Livros', nameEn: 'Books', icon: 'book-open-variant' },
      { name: 'Material', nameEn: 'Supplies', icon: 'pencil' },
      { name: 'Mensalidade', nameEn: 'Tuition', icon: 'book-education' },
    ],
  },
  {
    name: 'Assinaturas',
    nameEn: 'Subscriptions',
    icon: 'application',
    color: '#E11D48',
    subcategories: [
      { name: 'Netflix', nameEn: 'Netflix', icon: 'brand:netflix' },
      { name: 'Spotify', nameEn: 'Spotify', icon: 'brand:spotify' },
      { name: 'YouTube Premium', nameEn: 'YouTube Premium', icon: 'brand:youtube' },
      { name: 'Disney+', nameEn: 'Disney+', icon: 'star-circle' },
      { name: 'Amazon Prime', nameEn: 'Amazon Prime', icon: 'package-variant-closed' },
      { name: 'HBO Max', nameEn: 'HBO Max', icon: 'brand:hbomax' },
      { name: 'Paramount+', nameEn: 'Paramount+', icon: 'brand:paramountplus' },
      { name: 'Crunchyroll', nameEn: 'Crunchyroll', icon: 'brand:crunchyroll' },
      { name: 'Apple Music', nameEn: 'Apple Music', icon: 'brand:applemusic' },
      { name: 'Deezer', nameEn: 'Deezer', icon: 'brand:deezer' },
      { name: 'iCloud', nameEn: 'iCloud', icon: 'brand:icloud' },
      { name: 'Google One', nameEn: 'Google One', icon: 'brand:googleplay' },
      { name: 'Microsoft 365', nameEn: 'Microsoft 365', icon: 'microsoft' },
      { name: 'Uber', nameEn: 'Uber', icon: 'brand:uber' },
      { name: 'Uber Eats', nameEn: 'Uber Eats', icon: 'brand:ubereats' },
      { name: 'iFood', nameEn: 'iFood', icon: 'brand:ifood' },
      { name: 'Mercado Livre', nameEn: 'Mercado Livre', icon: 'shopping' },
      { name: 'Xbox Game Pass', nameEn: 'Xbox Game Pass', icon: 'microsoft-xbox' },
      { name: 'PlayStation Plus', nameEn: 'PlayStation Plus', icon: 'brand:playstation' },
      { name: 'Twitch', nameEn: 'Twitch', icon: 'brand:twitch' },
    ],
  },
  {
    name: 'Contas',
    nameEn: 'Bills',
    icon: 'file-document',
    color: '#0EA5A4',
    subcategories: [
      { name: 'Cartão de crédito', nameEn: 'Credit card', icon: 'credit-card' },
      { name: 'Telefone', nameEn: 'Phone', icon: 'cellphone' },
      { name: 'Assinaturas', nameEn: 'Subscriptions', icon: 'application' },
      { name: 'Seguros', nameEn: 'Insurance', icon: 'shield-check' },
      { name: 'Tarifas bancárias', nameEn: 'Bank fees', icon: 'bank' },
    ],
  },
  {
    name: 'Cuidados',
    nameEn: 'Personal care',
    icon: 'content-cut',
    color: '#F59E0B',
    subcategories: [
      { name: 'Cabelo', nameEn: 'Hair', icon: 'content-cut' },
      { name: 'Beleza', nameEn: 'Beauty', icon: 'face-woman-shimmer' },
      { name: 'Cosméticos', nameEn: 'Cosmetics', icon: 'spray' },
    ],
  },
  {
    name: 'Pets',
    nameEn: 'Pets',
    icon: 'paw',
    color: '#84CC16',
    subcategories: [
      { name: 'Ração', nameEn: 'Pet food', icon: 'dog' },
      { name: 'Veterinário', nameEn: 'Vet', icon: 'medical-bag' },
      { name: 'Banho e tosa', nameEn: 'Grooming', icon: 'content-cut' },
    ],
  },
  {
    name: 'Outros',
    nameEn: 'Other',
    icon: 'dots-horizontal',
    color: '#64748B',
    subcategories: [
      { name: 'Doações', nameEn: 'Donations', icon: 'hand-heart' },
      { name: 'Imprevistos', nameEn: 'Unexpected', icon: 'umbrella' },
      { name: 'Diversos', nameEn: 'Miscellaneous', icon: 'tag' },
    ],
  },
];

/** Nome da categoria (ou subcategoria) padrão no idioma pedido. */
export function defaultName(
  entry: { name: string; nameEn: string },
  lang: Lang
): string {
  return lang === 'en' ? entry.nameEn : entry.name;
}
