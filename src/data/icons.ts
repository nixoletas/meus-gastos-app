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
  { name: 'aws', keywords: ['aws', 'amazon', 'nuvem', 'servidor', 'hospedagem', 'iaas'], en: ['aws', 'amazon', 'cloud', 'server', 'hosting', 'iaas'] },
  { name: 'microsoft-azure', keywords: ['azure', 'microsoft', 'nuvem', 'servidor', 'iaas'], en: ['azure', 'microsoft', 'cloud', 'server', 'iaas'] },
  { name: 'google-cloud', keywords: ['google', 'cloud', 'gcp', 'nuvem', 'servidor', 'iaas'], en: ['google', 'cloud', 'gcp', 'server', 'iaas'] },
  { name: 'digital-ocean', keywords: ['digitalocean', 'nuvem', 'servidor', 'vps', 'iaas'], en: ['digitalocean', 'cloud', 'server', 'vps', 'iaas'] },
  { name: 'firebase', keywords: ['firebase', 'google', 'banco', 'de', 'dados', 'backend', 'paas', 'nuvem'], en: ['firebase', 'google', 'database', 'backend', 'paas', 'nuvem'] },
  { name: 'brand:cloudflare', keywords: ['cloudflare', 'cdn', 'dns', 'dominio', 'iaas', 'nuvem'], en: ['cloudflare', 'cdn', 'dns', 'domain', 'iaas', 'nuvem'] },
  { name: 'brand:vercel', keywords: ['vercel', 'deploy', 'hospedagem', 'front', 'paas', 'nuvem'], en: ['vercel', 'deploy', 'hosting', 'frontend', 'paas', 'nuvem'] },
  { name: 'brand:netlify', keywords: ['netlify', 'deploy', 'hospedagem', 'site', 'paas', 'nuvem'], en: ['netlify', 'deploy', 'hosting', 'site', 'paas', 'nuvem'] },
  { name: 'brand:supabase', keywords: ['supabase', 'banco', 'de', 'dados', 'backend', 'paas', 'nuvem'], en: ['supabase', 'database', 'backend', 'paas', 'nuvem'] },
  { name: 'brand:vultr', keywords: ['vultr', 'nuvem', 'servidor', 'vps', 'iaas'], en: ['vultr', 'cloud', 'server', 'vps', 'iaas'] },
  { name: 'github', keywords: ['github', 'codigo', 'repositorio', 'git', 'saas'], en: ['github', 'code', 'repository', 'git', 'saas'] },
  { name: 'gitlab', keywords: ['gitlab', 'codigo', 'repositorio', 'git', 'ci', 'saas'], en: ['gitlab', 'code', 'repository', 'git', 'ci', 'saas'] },
  { name: 'bitbucket', keywords: ['bitbucket', 'codigo', 'repositorio', 'git'], en: ['bitbucket', 'code', 'repository', 'git'] },
  { name: 'docker', keywords: ['docker', 'container', 'imagem', 'registry'], en: ['docker', 'container', 'image', 'registry'] },
  { name: 'npm', keywords: ['npm', 'pacote', 'node', 'biblioteca'], en: ['npm', 'package', 'node', 'library'] },
  { name: 'jira', keywords: ['jira', 'atlassian', 'tarefas', 'projeto'], en: ['jira', 'atlassian', 'issues', 'project'] },
  { name: 'atlassian', keywords: ['atlassian', 'confluence', 'jira'], en: ['atlassian', 'confluence', 'jira'] },
  { name: 'brand:sentry', keywords: ['sentry', 'erro', 'monitoramento', 'log', 'saas'], en: ['sentry', 'error', 'monitoring', 'logs', 'saas'] },
  { name: 'brand:datadog', keywords: ['datadog', 'monitoramento', 'metrica', 'observabilidade', 'saas'], en: ['datadog', 'monitoring', 'metrics', 'observability', 'saas'] },
  { name: 'brand:linear', keywords: ['linear', 'tarefas', 'projeto', 'issue', 'saas'], en: ['linear', 'issues', 'project', 'tracker', 'saas'] },
  { name: 'brand:figma', keywords: ['figma', 'design', 'prototipo', 'ui', 'saas'], en: ['figma', 'design', 'prototype', 'ui', 'saas'] },
  { name: 'brand:anthropic', keywords: ['anthropic', 'claude', 'ia', 'assistente', 'saas'], en: ['anthropic', 'claude', 'ai', 'assistant', 'saas'] },
  { name: 'brand:obsidian', keywords: ['obsidian', 'notas', 'markdown'], en: ['obsidian', 'notes', 'markdown'] },
  { name: 'slack', keywords: ['slack', 'chat', 'equipe', 'trabalho', 'saas'], en: ['slack', 'chat', 'team', 'work', 'saas'] },
  { name: 'salesforce', keywords: ['salesforce', 'crm', 'vendas', 'saas'], en: ['salesforce', 'crm', 'sales', 'saas'] },
  { name: 'hubspot', keywords: ['hubspot', 'crm', 'marketing', 'saas'], en: ['hubspot', 'crm', 'marketing', 'saas'] },
  { name: 'trello', keywords: ['trello', 'quadro', 'tarefas', 'kanban', 'saas'], en: ['trello', 'board', 'tasks', 'kanban', 'saas'] },
  { name: 'evernote', keywords: ['evernote', 'notas', 'caderno'], en: ['evernote', 'notes', 'notebook'] },
  { name: 'onepassword', keywords: ['1password', 'senha', 'cofre', 'seguranca'], en: ['1password', 'password', 'vault', 'security'] },
  { name: 'google-drive', keywords: ['google', 'drive', 'nuvem', 'arquivo', 'armazenamento'], en: ['google', 'drive', 'cloud', 'file', 'storage'] },
  { name: 'gmail', keywords: ['gmail', 'email', 'google'], en: ['gmail', 'email', 'google'] },
  { name: 'box', keywords: ['box', 'nuvem', 'arquivo', 'armazenamento'], en: ['box', 'cloud', 'file', 'storage'] },
  { name: 'wordpress', keywords: ['wordpress', 'site', 'blog', 'cms'], en: ['wordpress', 'site', 'blog', 'cms'] },
  { name: 'brand:notion', keywords: ['notion', 'notas', 'wiki', 'documento', 'saas'], en: ['notion', 'notes', 'wiki', 'docs', 'saas'] },
  { name: 'brand:zoom', keywords: ['zoom', 'video', 'reuniao', 'chamada', 'saas'], en: ['zoom', 'video', 'meeting', 'call', 'saas'] },
  { name: 'brand:asana', keywords: ['asana', 'tarefas', 'projeto', 'equipe', 'saas'], en: ['asana', 'tasks', 'project', 'team', 'saas'] },
  { name: 'brand:airtable', keywords: ['airtable', 'planilha', 'banco', 'base', 'saas'], en: ['airtable', 'spreadsheet', 'database', 'saas'] },
  { name: 'brand:miro', keywords: ['miro', 'quadro', 'branco', 'colaboracao', 'saas'], en: ['miro', 'whiteboard', 'collaboration', 'saas'] },
  { name: 'brand:todoist', keywords: ['todoist', 'tarefas', 'lista', 'saas'], en: ['todoist', 'tasks', 'todo', 'list', 'saas'] },
  { name: 'brand:stripe', keywords: ['stripe', 'pagamento', 'cartao', 'gateway', 'saas'], en: ['stripe', 'payment', 'card', 'gateway', 'saas'] },
  { name: 'brand:shopify', keywords: ['shopify', 'loja', 'ecommerce', 'saas'], en: ['shopify', 'store', 'ecommerce', 'saas'] },
  { name: 'brand:nubank', keywords: ['nubank', 'banco', 'cartao', 'roxinho'], en: ['nubank', 'bank', 'card'] },
  { name: 'brand:mercadopago', keywords: ['mercado', 'pago', 'pagamento', 'carteira'], en: ['mercado', 'pago', 'payment', 'wallet'] },
  { name: 'brand:picpay', keywords: ['picpay', 'pagamento', 'carteira'], en: ['picpay', 'payment', 'wallet'] },
  { name: 'brand:bitwarden', keywords: ['bitwarden', 'senha', 'cofre', 'seguranca'], en: ['bitwarden', 'password', 'vault', 'security'] },
  { name: 'brand:nordvpn', keywords: ['nordvpn', 'vpn', 'privacidade'], en: ['nordvpn', 'vpn', 'privacy'] },
  { name: 'brand:proton', keywords: ['proton', 'vpn', 'email', 'privacidade'], en: ['proton', 'vpn', 'mail', 'privacy'] },
  { name: 'soundcloud', keywords: ['soundcloud', 'musica', 'audio'], en: ['soundcloud', 'music', 'audio'] },
  { name: 'brand:tidal', keywords: ['tidal', 'musica', 'streaming'], en: ['tidal', 'music', 'streaming'] },
  { name: 'brand:audible', keywords: ['audible', 'audiolivro', 'livro'], en: ['audible', 'audiobook', 'book'] },
  { name: 'brand:medium', keywords: ['medium', 'artigo', 'leitura', 'blog'], en: ['medium', 'article', 'reading', 'blog'] },
  { name: 'brand:substack', keywords: ['substack', 'newsletter', 'assinatura'], en: ['substack', 'newsletter', 'subscription'] },
  { name: 'steam', keywords: ['steam', 'jogo', 'game', 'pc'], en: ['steam', 'game', 'pc'] },
  { name: 'nintendo-switch', keywords: ['nintendo', 'switch', 'jogo', 'console'], en: ['nintendo', 'switch', 'game', 'console'] },
  { name: 'brand:epicgames', keywords: ['epic', 'games', 'jogo', 'loja'], en: ['epic', 'games', 'store'] },
  { name: 'linkedin', keywords: ['linkedin', 'trabalho', 'rede', 'profissional'], en: ['linkedin', 'work', 'professional', 'network'] },
  { name: 'patreon', keywords: ['patreon', 'apoio', 'criador', 'assinatura'], en: ['patreon', 'support', 'creator', 'subscription'] },
  { name: 'brand:discord', keywords: ['discord', 'chat', 'comunidade', 'voz'], en: ['discord', 'chat', 'community', 'voice'] },
  { name: 'brand:telegram', keywords: ['telegram', 'chat', 'mensagem'], en: ['telegram', 'chat', 'message'] },
  { name: 'brand:duolingo', keywords: ['duolingo', 'idioma', 'curso', 'lingua'], en: ['duolingo', 'language', 'course'] },
  { name: 'brand:coursera', keywords: ['coursera', 'curso', 'educacao', 'online'], en: ['coursera', 'course', 'education', 'online'] },
  { name: 'brand:udemy', keywords: ['udemy', 'curso', 'educacao', 'online'], en: ['udemy', 'course', 'education', 'online'] },
  { name: 'brand:strava', keywords: ['strava', 'corrida', 'bike', 'treino'], en: ['strava', 'running', 'cycling', 'workout'] },
];

/**
 * Catálogo curado de ícones para categorias.
 * Combina logos de marcas e ícones do MaterialCommunityIcons.
 */
export const ICON_CATALOG: CatalogIcon[] = [
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

  // Alimentação
  { name: 'fish', keywords: ['peixe', 'frutos', 'do', 'mar', 'comida'], en: ['fish', 'seafood', 'food'] },
  { name: 'egg', keywords: ['ovo', 'cafe', 'da', 'manha', 'comida'], en: ['egg', 'breakfast', 'food'] },
  { name: 'cheese', keywords: ['queijo', 'frios', 'comida'], en: ['cheese', 'dairy', 'food'] },
  { name: 'fruit-cherries', keywords: ['fruta', 'feira', 'hortifruti'], en: ['fruit', 'produce', 'grocery'] },
  { name: 'carrot', keywords: ['legume', 'verdura', 'feira'], en: ['vegetable', 'produce', 'grocery'] },
  { name: 'rice', keywords: ['arroz', 'mantimento', 'comida'], en: ['rice', 'grains', 'food'] },
  { name: 'bottle-wine', keywords: ['vinho', 'bebida', 'adega'], en: ['wine', 'drink', 'cellar'] },
  { name: 'glass-cocktail', keywords: ['drink', 'bar', 'coquetel', 'bebida'], en: ['cocktail', 'bar', 'drink'] },
  { name: 'silverware-spoon', keywords: ['comida', 'refeicao', 'talher'], en: ['food', 'meal', 'cutlery'] },
  { name: 'silverware-variant', keywords: ['restaurante', 'refeicao', 'comida'], en: ['restaurant', 'meal', 'food'] },

  // Transporte
  { name: 'scooter', keywords: ['patinete', 'scooter', 'mobilidade'], en: ['scooter', 'kick', 'scooter', 'mobility'] },
  { name: 'ferry', keywords: ['barca', 'balsa', 'travessia'], en: ['ferry', 'boat', 'crossing'] },
  { name: 'train-car', keywords: ['trem', 'vagao', 'carga'], en: ['train', 'wagon', 'freight'] },
  { name: 'fuel', keywords: ['combustivel', 'gasolina', 'posto'], en: ['fuel', 'gas', 'station'] },
  { name: 'oil', keywords: ['oleo', 'troca', 'manutencao'], en: ['oil', 'change', 'maintenance'] },
  { name: 'car-battery', keywords: ['bateria', 'carro', 'manutencao'], en: ['battery', 'car', 'maintenance'] },
  { name: 'engine', keywords: ['motor', 'mecanica', 'manutencao'], en: ['engine', 'mechanic', 'maintenance'] },
  { name: 'sail-boat', keywords: ['barco', 'vela', 'passeio'], en: ['boat', 'sailing', 'trip'] },

  // Casa
  { name: 'washing-machine', keywords: ['lavanderia', 'maquina', 'de', 'lavar', 'roupa'], en: ['laundry', 'washing', 'machine'] },
  { name: 'fridge', keywords: ['geladeira', 'eletrodomestico', 'cozinha'], en: ['fridge', 'appliance', 'kitchen'] },
  { name: 'stove', keywords: ['fogao', 'eletrodomestico', 'cozinha'], en: ['stove', 'appliance', 'kitchen'] },
  { name: 'air-conditioner', keywords: ['ar', 'condicionado', 'climatizacao'], en: ['air', 'conditioner', 'hvac'] },
  { name: 'solar-power', keywords: ['energia', 'solar', 'placa', 'painel'], en: ['solar', 'power', 'panel', 'energy'] },
  { name: 'lightning-bolt', keywords: ['energia', 'eletrica', 'luz'], en: ['power', 'electricity', 'energy'] },
  { name: 'candle', keywords: ['vela', 'decoracao', 'casa'], en: ['candle', 'decor', 'home'] },
  { name: 'flower', keywords: ['flor', 'planta', 'decoracao'], en: ['flower', 'plant', 'decor'] },
  { name: 'tree', keywords: ['arvore', 'jardim', 'planta'], en: ['tree', 'garden', 'plant'] },

  // Contas e finanças
  { name: 'wallet', keywords: ['carteira', 'dinheiro'], en: ['wallet', 'money'] },
  { name: 'cash-multiple', keywords: ['dinheiro', 'notas', 'pagamento'], en: ['cash', 'bills', 'payment'] },
  { name: 'cash-fast', keywords: ['pix', 'transferencia', 'rapida'], en: ['instant', 'transfer', 'payment'] },
  { name: 'cash-lock', keywords: ['reserva', 'poupanca', 'guardado'], en: ['savings', 'locked', 'reserve'] },
  { name: 'bank-transfer', keywords: ['transferencia', 'ted', 'doc', 'banco'], en: ['bank', 'transfer', 'wire'] },
  { name: 'currency-brl', keywords: ['real', 'brl', 'moeda', 'dinheiro'], en: ['real', 'brl', 'currency', 'money'] },
  { name: 'currency-usd', keywords: ['dolar', 'usd', 'moeda', 'cambio'], en: ['dollar', 'usd', 'currency', 'exchange'] },
  { name: 'calculator', keywords: ['calculo', 'conta', 'imposto'], en: ['calculator', 'math', 'tax'] },
  { name: 'hand-coin', keywords: ['emprestimo', 'doacao', 'dinheiro'], en: ['loan', 'donation', 'money'] },
  { name: 'safe-square', keywords: ['cofre', 'reserva', 'seguranca'], en: ['safe', 'vault', 'reserve'] },
  { name: 'piggy-bank-outline', keywords: ['poupanca', 'economia', 'cofrinho'], en: ['savings', 'piggy', 'bank'] },
  { name: 'receipt-text', keywords: ['recibo', 'nota', 'cupom'], en: ['receipt', 'invoice', 'bill'] },
  { name: 'sale', keywords: ['desconto', 'promocao', 'oferta'], en: ['discount', 'sale', 'offer'] },
  { name: 'chart-bar', keywords: ['grafico', 'relatorio', 'analise'], en: ['chart', 'report', 'analysis'] },
  { name: 'chart-pie', keywords: ['grafico', 'pizza', 'distribuicao'], en: ['pie', 'chart', 'breakdown'] },
  { name: 'chart-areaspline', keywords: ['grafico', 'tendencia', 'evolucao'], en: ['trend', 'chart', 'growth'] },
  { name: 'scale', keywords: ['balanca', 'comparacao', 'peso'], en: ['scale', 'compare', 'weight'] },
  { name: 'gavel', keywords: ['juridico', 'advogado', 'processo'], en: ['legal', 'lawyer', 'court'] },

  // Compras
  { name: 'tag-multiple', keywords: ['etiqueta', 'categoria', 'varios'], en: ['tags', 'labels', 'category'] },
  { name: 'cart-variant', keywords: ['carrinho', 'compras', 'mercado'], en: ['cart', 'shopping', 'grocery'] },
  { name: 'truck-delivery', keywords: ['entrega', 'frete', 'delivery'], en: ['delivery', 'shipping', 'freight'] },
  { name: 'package-variant', keywords: ['encomenda', 'pacote', 'entrega'], en: ['package', 'parcel', 'delivery'] },
  { name: 'warehouse', keywords: ['estoque', 'deposito', 'galpao'], en: ['warehouse', 'storage', 'stock'] },
  { name: 'store', keywords: ['loja', 'comercio', 'mercado'], en: ['store', 'shop', 'retail'] },
  { name: 'storefront', keywords: ['loja', 'vitrine', 'comercio'], en: ['storefront', 'shop', 'retail'] },

  // Saúde
  { name: 'needle', keywords: ['vacina', 'injecao', 'exame'], en: ['vaccine', 'injection', 'shot'] },
  { name: 'bandage', keywords: ['curativo', 'ferimento', 'primeiros', 'socorros'], en: ['bandage', 'wound', 'first', 'aid'] },
  { name: 'stethoscope', keywords: ['medico', 'consulta', 'clinica'], en: ['doctor', 'checkup', 'clinic'] },
  { name: 'wheelchair', keywords: ['acessibilidade', 'cadeira', 'de', 'rodas'], en: ['wheelchair', 'accessibility'] },
  { name: 'eye-outline', keywords: ['oftalmo', 'visao', 'exame'], en: ['eye', 'vision', 'exam'] },
  { name: 'ear-hearing', keywords: ['audicao', 'otorrino', 'aparelho'], en: ['hearing', 'ear', 'aid'] },
  { name: 'brain', keywords: ['terapia', 'psicologo', 'mente'], en: ['therapy', 'psychologist', 'mind'] },
  { name: 'yoga', keywords: ['yoga', 'alongamento', 'bem-estar'], en: ['yoga', 'stretching', 'wellness'] },

  // Lazer e esporte
  { name: 'theater', keywords: ['teatro', 'espetaculo', 'cultura'], en: ['theater', 'show', 'culture'] },
  { name: 'music-note', keywords: ['musica', 'show', 'audio'], en: ['music', 'concert', 'audio'] },
  { name: 'microphone', keywords: ['karaoke', 'show', 'podcast'], en: ['karaoke', 'mic', 'podcast'] },
  { name: 'podcast', keywords: ['podcast', 'audio', 'assinatura'], en: ['podcast', 'audio', 'subscription'] },
  { name: 'book', keywords: ['livro', 'leitura'], en: ['book', 'reading'] },
  { name: 'newspaper', keywords: ['jornal', 'noticia', 'assinatura'], en: ['newspaper', 'news', 'subscription'] },
  { name: 'radio', keywords: ['radio', 'audio', 'musica'], en: ['radio', 'audio', 'music'] },
  { name: 'television', keywords: ['tv', 'streaming', 'assinatura'], en: ['tv', 'streaming', 'subscription'] },
  { name: 'filmstrip', keywords: ['cinema', 'filme', 'video'], en: ['cinema', 'movie', 'film'] },
  { name: 'cards-playing', keywords: ['jogo', 'carta', 'baralho'], en: ['cards', 'game', 'deck'] },
  { name: 'soccer', keywords: ['futebol', 'esporte', 'jogo'], en: ['soccer', 'football', 'sport'] },
  { name: 'basketball', keywords: ['basquete', 'esporte', 'jogo'], en: ['basketball', 'sport', 'game'] },
  { name: 'tennis', keywords: ['tenis', 'esporte', 'raquete'], en: ['tennis', 'sport', 'racket'] },
  { name: 'swim', keywords: ['natacao', 'piscina', 'esporte'], en: ['swimming', 'pool', 'sport'] },
  { name: 'ski', keywords: ['esqui', 'neve', 'viagem'], en: ['ski', 'snow', 'travel'] },
  { name: 'hiking', keywords: ['trilha', 'caminhada', 'natureza'], en: ['hiking', 'trail', 'outdoors'] },
  { name: 'tent', keywords: ['camping', 'acampamento', 'viagem'], en: ['camping', 'tent', 'travel'] },

  // Tecnologia
  { name: 'server', keywords: ['servidor', 'hospedagem', 'vps'], en: ['server', 'hosting', 'vps'] },
  { name: 'server-network', keywords: ['rede', 'servidor', 'infraestrutura'], en: ['network', 'server', 'infrastructure'] },
  { name: 'database', keywords: ['banco', 'de', 'dados', 'armazenamento'], en: ['database', 'storage'] },
  { name: 'cloud-upload', keywords: ['backup', 'nuvem', 'envio'], en: ['backup', 'cloud', 'upload'] },
  { name: 'cloud-download', keywords: ['download', 'nuvem', 'arquivo'], en: ['download', 'cloud', 'file'] },
  { name: 'api', keywords: ['api', 'integracao', 'servico'], en: ['api', 'integration', 'service'] },
  { name: 'code-braces', keywords: ['codigo', 'dev', 'programacao'], en: ['code', 'dev', 'programming'] },
  { name: 'web', keywords: ['site', 'dominio', 'internet'], en: ['website', 'domain', 'internet'] },
  { name: 'domain', keywords: ['dominio', 'site', 'registro'], en: ['domain', 'site', 'registrar'] },
  { name: 'monitor', keywords: ['monitor', 'computador', 'tela'], en: ['monitor', 'computer', 'screen'] },
  { name: 'tablet', keywords: ['tablet', 'ipad', 'dispositivo'], en: ['tablet', 'ipad', 'device'] },
  { name: 'harddisk', keywords: ['disco', 'hd', 'armazenamento'], en: ['disk', 'hdd', 'storage'] },
  { name: 'memory', keywords: ['memoria', 'ram', 'hardware'], en: ['memory', 'ram', 'hardware'] },
  { name: 'cpu-64-bit', keywords: ['processador', 'cpu', 'hardware'], en: ['processor', 'cpu', 'hardware'] },
  { name: 'robot', keywords: ['ia', 'bot', 'automacao'], en: ['ai', 'bot', 'automation'] },
  { name: 'key-variant', keywords: ['senha', 'chave', 'licenca'], en: ['password', 'key', 'license'] },
  { name: 'shield-lock', keywords: ['seguranca', 'protecao', 'antivirus'], en: ['security', 'protection', 'antivirus'] },
  { name: 'vpn', keywords: ['vpn', 'privacidade', 'rede'], en: ['vpn', 'privacy', 'network'] },
  { name: 'email', keywords: ['email', 'correio', 'mensagem'], en: ['email', 'mail', 'message'] },
  { name: 'at', keywords: ['email', 'arroba', 'conta'], en: ['email', 'at', 'account'] },
  { name: 'cellphone-charging', keywords: ['carregador', 'bateria', 'celular'], en: ['charger', 'battery', 'phone'] },
  { name: 'lightbulb-on', keywords: ['ideia', 'dica', 'lampada'], en: ['idea', 'tip', 'lightbulb'] },

  // Família e pets
  { name: 'baby', keywords: ['bebe', 'filho', 'crianca'], en: ['baby', 'child', 'kid'] },
  { name: 'human-cane', keywords: ['idoso', 'avo', 'cuidado'], en: ['elderly', 'senior', 'care'] },
  { name: 'school-outline', keywords: ['escola', 'faculdade', 'estudo'], en: ['school', 'college', 'study'] },
  { name: 'bird', keywords: ['passaro', 'pet', 'animal'], en: ['bird', 'pet', 'animal'] },
  { name: 'rabbit', keywords: ['coelho', 'pet', 'animal'], en: ['rabbit', 'pet', 'animal'] },
  { name: 'horse', keywords: ['cavalo', 'animal', 'haras'], en: ['horse', 'animal', 'stable'] },
  { name: 'account-group', keywords: ['familia', 'grupo', 'pessoas'], en: ['family', 'group', 'people'] },
  { name: 'handshake', keywords: ['acordo', 'parceria', 'negocio'], en: ['deal', 'partnership', 'business'] },
  { name: 'charity', keywords: ['doacao', 'caridade', 'ajuda'], en: ['donation', 'charity', 'help'] },
  { name: 'church', keywords: ['igreja', 'religiao', 'dizimo'], en: ['church', 'religion', 'tithe'] },

  // Trabalho e documentos
  { name: 'briefcase-account', keywords: ['trabalho', 'cliente', 'profissional'], en: ['work', 'client', 'professional'] },
  { name: 'calendar-check', keywords: ['agendamento', 'compromisso', 'data'], en: ['appointment', 'schedule', 'date'] },
  { name: 'calendar-clock', keywords: ['vencimento', 'prazo', 'lembrete'], en: ['due', 'date', 'deadline', 'reminder'] },
  { name: 'clock-outline', keywords: ['hora', 'tempo', 'duracao'], en: ['time', 'hour', 'duration'] },
  { name: 'timer-outline', keywords: ['tempo', 'cronometro', 'duracao'], en: ['timer', 'duration', 'stopwatch'] },
  { name: 'passport', keywords: ['passaporte', 'viagem', 'documento'], en: ['passport', 'travel', 'document'] },
  { name: 'shield-account', keywords: ['seguro', 'protecao', 'pessoal'], en: ['insurance', 'protection', 'personal'] },

  // Marcas e serviços de assinatura (no fim: o grid abre nos genéricos)
  ...BRAND_CATALOG,
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
