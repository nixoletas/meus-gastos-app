// Busca da página de consulta da NFC-e.
//
// Parece um `fetch` simples, mas os portais em ASP.NET (SP à frente) não
// entregam a nota na primeira resposta: mandam um 302 que grava o cookie de
// sessão e redirecionam de volta. Sem guardar o cookie, o `fetch` do Deno
// segue o redirect "de mãos vazias" e cai em laço ou na página de erro.
// Por isso seguimos os redirects à mão, com um pote de cookies, e checamos
// cada salto contra o filtro de portal — um redirect não pode levar a função
// para fora do `.gov.br`.
import { portalPermitido } from './chave.ts';

/** Mais que isso é laço de redirect, não consulta. */
const MAX_SALTOS = 8;

const HEADERS = {
  // Navegador de celular comum: é para ele que a página do QR foi feita, e
  // alguns portais devolvem página vazia (ou bloqueiam) cliente "robô".
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

export type Pagina = { status: number; html: string; url: string };

/** O QR de alguns estados ainda vem em `http://`; o portal atende em https. */
export function paraHttps(raw: string): string {
  const limpo = raw.trim();
  return /^http:\/\//i.test(limpo) ? 'https://' + limpo.slice(7) : limpo;
}

/** Guarda só `nome=valor` de cada Set-Cookie; atributos não interessam aqui. */
function guardarCookies(pote: Map<string, string>, resposta: Response) {
  const lista =
    typeof resposta.headers.getSetCookie === 'function'
      ? resposta.headers.getSetCookie()
      : [resposta.headers.get('set-cookie') ?? ''].filter(Boolean);
  for (const cookie of lista) {
    const par = cookie.split(';')[0];
    const i = par.indexOf('=');
    if (i <= 0) continue;
    pote.set(par.slice(0, i).trim(), par.slice(i + 1).trim());
  }
}

/**
 * Portal de SEFAZ ainda serve ISO-8859-1; `Response.text()` sempre decodifica
 * como UTF-8 e estragaria os acentos das descrições.
 */
async function lerTexto(resposta: Response): Promise<string> {
  const bytes = new Uint8Array(await resposta.arrayBuffer());
  const doCabecalho = resposta.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1];
  const inicio = new TextDecoder('latin1').decode(bytes.slice(0, 2048));
  const doMeta = inicio.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  const charset = (doCabecalho ?? doMeta ?? 'utf-8').toLowerCase();
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

/** Busca a URL do QR seguindo redirects com cookies. `null` = saiu do `.gov.br`. */
export async function buscarPagina(inicial: string, signal: AbortSignal): Promise<Pagina | null> {
  const pote = new Map<string, string>();
  let url = paraHttps(inicial);

  for (let salto = 0; salto <= MAX_SALTOS; salto += 1) {
    if (!portalPermitido(url)) return null;

    const cookie = [...pote].map(([nome, valor]) => `${nome}=${valor}`).join('; ');
    const resposta = await fetch(url, {
      redirect: 'manual',
      signal,
      headers: cookie ? { ...HEADERS, Cookie: cookie } : HEADERS,
    });
    guardarCookies(pote, resposta);

    const destino = resposta.headers.get('location');
    if (resposta.status >= 300 && resposta.status < 400 && destino) {
      await resposta.body?.cancel();
      url = paraHttps(new URL(destino, url).toString());
      continue;
    }

    return { status: resposta.status, html: await lerTexto(resposta), url };
  }

  throw new Error('nfce: redirects demais');
}
