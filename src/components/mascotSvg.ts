/**
 * SVGs do mascote "Pim", o porquinho-cofrinho do Meus Gastos.
 * Em formato de string para serem usados tanto no app (via SvgXml do
 * react-native-svg) quanto no script que gera os ícones/splash/OpenGraph.
 */

export type PiggyColors = {
  body: string;
  dark: string;
  slot: string;
  cheek: string;
  eye: string;
  shine: string;
};

export const PIGGY_BRAND: PiggyColors = {
  body: '#14B8A6',
  dark: '#0E8F87',
  slot: '#06403E',
  cheek: '#FCA5A5',
  eye: '#0F172A',
  shine: '#FFFFFF',
};

export const PIGGY_WHITE: PiggyColors = {
  body: '#FFFFFF',
  dark: '#D7F5F0',
  slot: '#0E8F87',
  cheek: '#FCA5A5',
  eye: '#0F2A4A',
  shine: '#FFFFFF',
};

/** Corpo do porquinho (viewBox 0 0 200 200). Sem olhos fechados (ver blink). */
export function piggyBody(c: PiggyColors): string {
  return `
  <path d="M50 62 Q40 28 74 46 Q70 66 60 72 Z" fill="${c.dark}"/>
  <path d="M150 62 Q160 28 126 46 Q130 66 140 72 Z" fill="${c.dark}"/>
  <ellipse cx="100" cy="114" rx="76" ry="62" fill="${c.body}"/>
  <rect x="76" y="60" width="48" height="11" rx="5.5" fill="${c.slot}"/>
  <circle cx="56" cy="128" r="13" fill="${c.cheek}" opacity="0.65"/>
  <circle cx="144" cy="128" r="13" fill="${c.cheek}" opacity="0.65"/>
  <ellipse cx="100" cy="132" rx="34" ry="23" fill="${c.dark}"/>
  <ellipse cx="89" cy="132" rx="6" ry="8.5" fill="${c.slot}"/>
  <ellipse cx="111" cy="132" rx="6" ry="8.5" fill="${c.slot}"/>`;
}

/** Olhos abertos. */
export function piggyEyesOpen(c: PiggyColors): string {
  return `
  <circle cx="78" cy="104" r="9" fill="${c.eye}"/>
  <circle cx="122" cy="104" r="9" fill="${c.eye}"/>
  <circle cx="81" cy="101" r="3" fill="${c.shine}"/>
  <circle cx="125" cy="101" r="3" fill="${c.shine}"/>`;
}

/** Olhos fechados (para piscar). */
export function piggyEyesClosed(c: PiggyColors): string {
  return `
  <path d="M70 104 Q78 110 86 104" stroke="${c.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M114 104 Q122 110 130 104" stroke="${c.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
}

/** Porquinho completo como string SVG. */
export function piggySvg(c: PiggyColors = PIGGY_BRAND, blink = false): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${piggyBody(
    c
  )}${blink ? piggyEyesClosed(c) : piggyEyesOpen(c)}</svg>`;
}

/** Moeda dourada de R$. */
export function coinSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#D99A00"/>
  <circle cx="24" cy="24" r="18" fill="#F5B301"/>
  <circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2"/>
  <text x="24" y="32" font-size="20" font-weight="bold" text-anchor="middle" fill="#7A4E00" font-family="Arial, sans-serif">R$</text>
</svg>`;
}
