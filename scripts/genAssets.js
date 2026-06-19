/**
 * Gera os assets de marca (ícone, adaptive, splash, favicon, OpenGraph)
 * a partir do mascote em SVG. Rode com: node scripts/genAssets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets');

// ---- Mascote (porquinho) como markup interno reutilizável ----
function innerPiggy(c) {
  return `
  <path d="M50 62 Q40 28 74 46 Q70 66 60 72 Z" fill="${c.dark}"/>
  <path d="M150 62 Q160 28 126 46 Q130 66 140 72 Z" fill="${c.dark}"/>
  <ellipse cx="100" cy="114" rx="76" ry="62" fill="${c.body}"/>
  <rect x="76" y="60" width="48" height="11" rx="5.5" fill="${c.slot}"/>
  <circle cx="56" cy="128" r="13" fill="${c.cheek}" opacity="0.65"/>
  <circle cx="144" cy="128" r="13" fill="${c.cheek}" opacity="0.65"/>
  <ellipse cx="100" cy="130" rx="34" ry="22" fill="${c.dark}"/>
  <ellipse cx="89" cy="130" rx="6" ry="8.5" fill="${c.slot}"/>
  <ellipse cx="111" cy="130" rx="6" ry="8.5" fill="${c.slot}"/>
  <path d="M85 156 Q100 167 115 156" fill="none" stroke="${c.slot}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="78" cy="104" r="9" fill="${c.eye}"/>
  <circle cx="122" cy="104" r="9" fill="${c.eye}"/>
  <circle cx="81" cy="101" r="3" fill="${c.shine}"/>
  <circle cx="125" cy="101" r="3" fill="${c.shine}"/>`;
}

function coin(x, y, r) {
  const s = r / 24;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <circle cx="24" cy="24" r="22" fill="#D99A00"/>
    <circle cx="24" cy="24" r="18" fill="#F5B301"/>
    <text x="24" y="32" font-size="20" font-weight="bold" text-anchor="middle" fill="#7A4E00" font-family="DejaVu Sans, Arial, sans-serif">R$</text>
  </g>`;
}

const WHITE = { body: '#FFFFFF', dark: '#D7F5F0', slot: '#0E8F87', cheek: '#FCA5A5', eye: '#0F2A4A', shine: '#FFFFFF' };

/** Coloca o porquinho (200x200) escalado/centrado num canvas. */
function placePiggy(size, scale, offsetY = 0, c = WHITE) {
  const px = 200 * scale;
  const tx = (size - px) / 2;
  const ty = (size - px) / 2 + offsetY;
  return `<g transform="translate(${tx},${ty}) scale(${scale})">${innerPiggy(c)}</g>`;
}

function tealBg(size, rounded) {
  const rx = rounded ? size * 0.22 : 0;
  return `
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0EA5A4"/><stop offset="1" stop-color="#0891B2"/>
    </linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>`;
}

async function render(svg, w, h, file) {
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(path.join(OUT, file));
  console.log('gerado', file);
}

(async () => {
  // App icon (full-bleed teal + porquinho branco + moeda)
  const S = 1024;
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${tealBg(S, false)}
    ${placePiggy(S, 2.9, 60)}
    <g transform="translate(${S / 2 - 70}, 150)">${coin(0, 0, 70)}</g>
  </svg>`;
  await render(icon, S, S, 'icon.png');

  // Adaptive (Android) — fundo transparente, porquinho dentro da zona segura
  const adaptive = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${placePiggy(S, 2.5, 0)}
  </svg>`;
  await render(adaptive, S, S, 'adaptive-icon.png');

  // Splash — transparente (Expo centraliza sobre o backgroundColor teal)
  const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${placePiggy(S, 2.6, 0)}
  </svg>`;
  await render(splash, S, S, 'splash-icon.png');

  // Favicon
  const F = 256;
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="${F}" height="${F}" viewBox="0 0 ${F} ${F}">
    ${tealBg(F, true)}
    ${placePiggy(F, 0.95, 8)}
  </svg>`;
  await render(favicon, F, F, 'favicon.png');

  // OpenGraph (1200x630)
  const W = 1200, H = 630;
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0EA5A4"/><stop offset="1" stop-color="#0891B2"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <g transform="translate(120,165) scale(1.5)">${innerPiggy(WHITE)}</g>
    <g transform="translate(190,135)">${coin(0, 0, 60)}</g>
    <text x="500" y="280" font-size="76" font-weight="bold" fill="#FFFFFF" font-family="DejaVu Sans, Arial, sans-serif">Meus Gastos</text>
    <text x="502" y="338" font-size="30" fill="#E6FFFB" font-family="DejaVu Sans, Arial, sans-serif">Controle seus gastos, sem complicação.</text>
    <text x="502" y="394" font-size="27" fill="#BDF3EC" font-family="DejaVu Sans, Arial, sans-serif">Feito no Brasil</text>
  </svg>`;
  await render(og, W, H, 'og-image.png');

  console.log('Pronto.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
