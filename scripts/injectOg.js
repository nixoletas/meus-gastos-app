/**
 * Injeta as meta tags de SEO/OpenGraph no dist/index.html após o
 * `expo export --platform web` (o modo SPA não usa app/+html.tsx).
 * Rode via: npm run build:web
 */
const fs = require('fs');
const path = require('path');

const INDEX = path.join(__dirname, '..', 'dist', 'index.html');

const TITLE = 'Meus Gastos — Controle de gastos sem complicação';
const DESCRIPTION =
  'App brasileiro para controlar seus gastos de forma simples: categorias, gráficos, limites e alertas. No celular e na web.';
const OG_IMAGE = '/og-image.png';

const META = `
    <meta name="description" content="${DESCRIPTION}" />
    <meta name="theme-color" content="#0EA5A4" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Meus Gastos" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="pt_BR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESCRIPTION}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
`;

if (!fs.existsSync(INDEX)) {
  console.error('dist/index.html não encontrado. Rode o expo export antes.');
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');
html = html.replace('<html lang="en"', '<html lang="pt-BR"');
if (!html.includes('og:title')) {
  html = html.replace('</head>', `${META}  </head>`);
}
// Título amigável da aba.
html = html.replace(/<title>.*?<\/title>/, `<title>${TITLE}</title>`);

fs.writeFileSync(INDEX, html);
console.log('OpenGraph injetado em dist/index.html');
