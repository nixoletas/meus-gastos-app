/**
 * Onde o gasto foi feito: nome do estabelecimento e/ou link do Google Maps.
 *
 * O campo da tela aceita os dois — quem cola um link não precisa saber que
 * ele vai para outra coluna.
 */

const MAPS_HOSTS = [
  /(^|\.)google\.[a-z.]+$/i,
  /^maps\.app\.goo\.gl$/i,
  /^goo\.gl$/i,
  /^g\.co$/i,
];

/** Primeiro link http(s) dentro do texto (o "Compartilhar" do Maps manda texto + link). */
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0] : null;
}

export function isMapsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    if (!MAPS_HOSTS.some((re) => re.test(u.hostname))) return false;
    // google.com sozinho não é mapa; exige /maps ou o encurtador.
    return /google\./i.test(u.hostname) ? u.pathname.startsWith('/maps') : true;
  } catch {
    return false;
  }
}

/**
 * Nome do lugar quando o link é o longo (`/maps/place/Padaria+Pão+Quente/@...`).
 * Link curto (maps.app.goo.gl) não carrega o nome — aí devolve nulo.
 */
export function placeNameFromMapsUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() || null;
    const q = u.searchParams.get('q') ?? u.searchParams.get('query');
    if (q && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q)) return q.trim();
    return null;
  } catch {
    return null;
  }
}

/**
 * Tenta descobrir o nome por trás de um link curto seguindo o redirecionamento.
 * Melhor esforço: sem rede ou se o Google mudar o formato, só não preenche.
 */
export async function resolvePlaceName(url: string, timeoutMs = 4000): Promise<string | null> {
  const direct = placeNameFromMapsUrl(url);
  if (direct) return direct;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    return res.url && res.url !== url ? placeNameFromMapsUrl(res.url) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Link que abre o Maps: o salvo, ou uma busca pelo nome. */
export function mapsLinkFor(place: string | null, placeUrl: string | null): string | null {
  if (placeUrl) return placeUrl;
  if (place?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.trim())}`;
  }
  return null;
}
