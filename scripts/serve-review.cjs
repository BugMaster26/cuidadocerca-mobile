const { createServer } = require('node:http');
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const { extname, resolve, sep } = require('node:path');

const root = resolve(__dirname, '../dist/revision-cuidadocerca');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const asset = resolve(root, '.' + pathname);
    if (asset !== root && !asset.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }

    const file = extname(pathname) ? asset : resolve(root, 'index.html');
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(8091, '127.0.0.1', () => console.log('CuidadoCerca: http://127.0.0.1:8091'));
