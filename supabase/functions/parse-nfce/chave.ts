// Chave de acesso e URL do QR Code da NFC-e.
//
// O QR do cupom segue o padrão ENCAT: a URL aponta para o portal da SEFAZ do
// próprio estado e traz `?p=<chave>|<versão>|<ambiente>[|...]`. Ou seja, o
// endereço certo da consulta vem no QR — não precisamos manter uma tabela de
// URL por UF, só saber ler o que veio.

/** Código IBGE da UF = os dois primeiros dígitos da chave. */
const UF_BY_CODE: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP',
  '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB',
  '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES',
  '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS',
  '51': 'MT', '52': 'GO', '53': 'DF',
};

/**
 * Só falamos com portal de governo. Sem esta trava a função vira um proxy
 * aberto: qualquer um mandaria a gente buscar qualquer URL da internet.
 */
export function portalPermitido(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || /^[\d.]+$/.test(host)) return false;
  return host === 'gov.br' || host.endsWith('.gov.br');
}

/** Extrai os 44 dígitos da chave de acesso da URL do QR. */
export function chaveDaUrl(raw: string): string | null {
  let candidato: string | null = null;

  try {
    const url = new URL(raw);
    // O parâmetro é `p` no padrão; alguns emissores mandam em maiúsculo.
    for (const [nome, valor] of url.searchParams) {
      if (nome.toLowerCase() !== 'p') continue;
      candidato = valor.split('|')[0].replace(/\D/g, '');
      break;
    }
  } catch {
    /* cai no varredor abaixo */
  }

  // Sem `p=` utilizável, procura qualquer sequência de 44 dígitos na URL.
  if (!candidato || candidato.length !== 44) {
    const achado = raw.replace(/\D/g, '').match(/\d{44}/);
    candidato = achado ? achado[0] : null;
  }

  return candidato && candidato.length === 44 ? candidato : null;
}

/**
 * Dígito verificador da chave (módulo 11, pesos 2..9 da direita para a
 * esquerda). Pega QR amassado ou lido errado antes de sair buscando na rede.
 */
export function chaveValida(chave: string): boolean {
  if (!/^\d{44}$/.test(chave)) return false;

  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i -= 1) {
    soma += Number(chave[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  const dv = resto === 0 || resto === 1 ? 0 : 11 - resto;
  return dv === Number(chave[43]);
}

/** O que dá para saber da nota sem consultar nada. */
export function dadosDaChave(chave: string) {
  return {
    uf: UF_BY_CODE[chave.slice(0, 2)] ?? null,
    /** AAMM da emissão — a chave não guarda o dia. */
    competencia: chave.slice(2, 6),
    cnpj: chave.slice(6, 20),
    modelo: chave.slice(20, 22),
    serie: chave.slice(22, 25),
    numero: chave.slice(25, 34),
  };
}
