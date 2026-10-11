const fs = require('node:fs');
const path = require('node:path');

const outputDirectory = path.join(__dirname, 'vercel-dist');
fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of ['index.html', 'App.js', 'style.css']) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outputDirectory, file));
}

for (const entry of ['report-map.mjs', 'report-point.mjs', 'map-data', 'map-vendor']) {
  fs.cpSync(path.join(__dirname, entry), path.join(outputDirectory, entry), { recursive: true });
}
