# 📄 Scraper Dictats (ceice.gva.es)

Script Node.js (`ceiceDictats.js`) que descarga los audios (pausat/seguit) y los textos en PDF de https://ceice.gva.es/es/web/dgplgm/dictats, agrupándolos por título y generando un índice JSON.

## 🚀 Qué hace
- Obtiene la página y localiza enlaces a `/documents/...` con extensiones `.mp3`, `.wav` y `.pdf`.
- Agrupa por título base (se quitan los paréntesis tipo `(pausat)`, `(seguit)`, `(text)`).
- Descarga:
  - Audios en `output-dictats/{YYYY-MM-DD}/audio/{slug}/{variant}.(mp3|wav)`.
  - PDFs en `output-dictats/{YYYY-MM-DD}/pdf/{slug}.pdf`.
- Genera `output-dictats/{YYYY-MM-DD}/index.json` con metadatos (título, slug, rutas locales y URLs origen).

## 🧰 Requisitos
- Node.js 18+.
- Dependencias: `fs-extra`, `node-fetch`, `cheerio`, `path` (nativo).

Instalación rápida:
```bash
npm install fs-extra node-fetch cheerio
```

## ▶️ Ejecución
```bash
node ceiceDictats.js
```

Salida principal:
- `output-dictats/{fecha}/audio/...`
- `output-dictats/{fecha}/pdf/...`
- `output-dictats/{fecha}/index.json`

## 🧠 Notas de organización
- El campo `variant` en el índice proviene del texto entre paréntesis (ej. `pausat`, `seguit`). Si un enlace no lleva paréntesis, se marca como `audio`.
- Los slugs se generan en minúsculas, sin tildes ni caracteres especiales.
- Si una entrada sólo tiene audio (sin PDF), se registrará igualmente en el índice sin campo `pdf`.

## 💰 Financiación
Este trabajo está financiado por el Ministerio para la Transformación Digital y de la Función Pública, cofinanciado por la UE - NextGenerationEU, en el marco del proyecto Desarrollo de Modelos ALIA.

## 🙏 Agradecimientos
- (pendiente)

## ⚠️ Aviso legal
Tenga en cuenta que los datos pueden contener sesgos u otras distorsiones no deseadas. Cuando terceros desplieguen sistemas o presten servicios basados en estos datos, o los utilicen directamente, serán responsables de mitigar los riesgos asociados y de garantizar el cumplimiento de la normativa aplicable, incluida aquella relacionada con el uso de la Inteligencia Artificial.

La Universidad de Alicante, como propietaria y creadora del conjunto de datos, no será responsable de los resultados derivados del uso por parte de terceros.

## 📜 Licencia
Este proyecto se distribuye bajo la licencia Apache 2.0.
