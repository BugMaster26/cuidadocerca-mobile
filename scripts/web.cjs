const http = require('node:http');
const { spawn } = require('node:child_process');

const metroPort = 8082;
const server = http.createServer((request, response) => {
  const upstream = http.request({ hostname: '127.0.0.1', port: metroPort,
    path: request.url, method: request.method, headers: request.headers }, result => {
    response.writeHead(result.statusCode, {
      ...result.headers,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    });
    result.pipe(response);
  });
  upstream.on('error', () => {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Expo está iniciando. Recarga en unos segundos.');
  });
  request.pipe(upstream);
});

server.listen(8080, 'localhost', () => {
  console.log('Abre CuidadoCerca en http://localhost:8080');
  const metro = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start',
    '--localhost', '--port', String(metroPort)], {
    stdio: 'inherit', env: { ...process.env, EXPO_OFFLINE: '1' },
  });
  metro.on('exit', code => { server.close(); process.exitCode = code || 0; });
  process.on('SIGINT', () => { metro.kill(); server.close(); });
});
