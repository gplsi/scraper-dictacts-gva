const fs = require('fs-extra');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
const cheerio = require('cheerio');

const BASE_URL = 'https://ceice.gva.es';
const PAGE_URL = `${BASE_URL}/es/web/dgplgm/dictats`;
const OUTPUT_DIR = './output-dictats';

function getCurrentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'sin-titulo';
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (scraper tv-a helper)' } });
  if (!res.ok) throw new Error(`Fallo al descargar la pagina: ${res.status} ${res.statusText}`);
  return res.text();
}

function parseEntries(html) {
  const $ = cheerio.load(html);
  const links = $('a[href*="/documents/"]').toArray();
  const entries = new Map();

  links.forEach((link) => {
    const href = $(link).attr('href');
    if (!href) return;

    const absoluteUrl = new URL(href, BASE_URL).toString();
    const urlObj = new URL(absoluteUrl);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    const fileSegment = [...segments].reverse().find((seg) => seg.includes('.'));
    const ext = fileSegment ? path.extname(fileSegment).toLowerCase() : '';
    if (!ext) return;

    const label = $(link).text().trim().replace(/\s+/g, ' ');
    const baseTitle = (label.replace(/\s*\(.*?\)\s*/g, '').trim() || 'Sin titulo').trim();
    const variantMatch = label.match(/\(([^)]+)\)/);
    const variant = variantMatch ? variantMatch[1].toLowerCase() : null;

    if (!entries.has(baseTitle)) {
      entries.set(baseTitle, { title: baseTitle, audios: [], pdf: null });
    }

    const entry = entries.get(baseTitle);

    if (ext === '.pdf') {
      entry.pdf = { url: absoluteUrl, label };
    } else if (ext === '.mp3' || ext === '.wav') {
      entry.audios.push({
        url: absoluteUrl,
        label,
        variant: variant || 'audio',
        ext: ext.replace('.', ''),
      });
    }
  });

  return Array.from(entries.values());
}

async function downloadFile(url, destPath) {
  await fs.ensureDir(path.dirname(destPath));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(buffer));
}

async function saveAssets(entries, date) {
  const index = {
    source: PAGE_URL,
    generatedAt: new Date().toISOString(),
    dateFolder: date,
    totalItems: entries.length,
    items: [],
  };

  for (const entry of entries) {
    const slug = createSlug(entry.title);
    const itemData = { title: entry.title, slug, pdf: null, audios: [] };

    if (entry.pdf) {
      const pdfPath = path.join(OUTPUT_DIR, date, 'pdf', `${slug}.pdf`);
      await downloadFile(entry.pdf.url, pdfPath);
      itemData.pdf = { url: entry.pdf.url, path: pdfPath };
      console.log(`PDF guardado: ${entry.title}`);
    }

    for (const audio of entry.audios) {
      const variantSlug = createSlug(audio.variant || 'audio');
      const audioPath = path.join(OUTPUT_DIR, date, 'audio', slug, `${variantSlug}.${audio.ext}`);
      await downloadFile(audio.url, audioPath);
      itemData.audios.push({
        url: audio.url,
        path: audioPath,
        label: audio.label,
        variant: audio.variant,
        ext: audio.ext,
      });
      console.log(`Audio guardado: ${entry.title} (${audio.variant || 'audio'})`);
    }

    index.items.push(itemData);
  }

  const indexPath = path.join(OUTPUT_DIR, date, 'index.json');
  await fs.ensureDir(path.dirname(indexPath));
  await fs.writeJson(indexPath, index, { spaces: 2 });
  console.log(`Índice guardado en: ${indexPath}`);
}

async function main() {
  console.log('Descargando pagina de dictats...');
  const html = await fetchPage(PAGE_URL);
  const entries = parseEntries(html);
  console.log(`Entradas detectadas: ${entries.length}`);

  if (entries.length === 0) {
    console.warn('No se encontraron entradas. ¿La pagina cambio o bloqueo el scraping?');
    return;
  }

  const currentDate = getCurrentDate();
  await saveAssets(entries, currentDate);

  console.log('Proceso completado.');
}

main().catch((err) => {
  console.error('Error en scraper dictats:', err);
  process.exitCode = 1;
});
