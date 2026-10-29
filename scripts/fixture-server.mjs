import http from 'node:http';
import { readFile } from 'node:fs/promises';

const previewPort = Number(process.env.WIDGET_PLAYGROUND_PORT ?? 4310);
const port = Number(process.env.WIDGET_FIXTURE_PORT ?? previewPort + 1);
const allowedParents = new Set([
  `http://127.0.0.1:${previewPort}`,
  `http://localhost:${previewPort}`,
]);
const assets = new Map([
  ['/fixture/fonts.css', ['fonts.css', 'text/css; charset=utf-8']],
  ['/fixture/fonts/inter-latin.woff2', ['fonts/inter-latin.woff2', 'font/woff2']],
  ['/fixture/fonts/inter-latin-ext.woff2', ['fonts/inter-latin-ext.woff2', 'font/woff2']],
  ['/fixture/fonts/inter-cyrillic.woff2', ['fonts/inter-cyrillic.woff2', 'font/woff2']],
  ['/fixture/preview.css', ['preview.css', 'text/css; charset=utf-8']],
  ['/fixture/preview.js', ['preview.js', 'text/javascript; charset=utf-8']],
  ['/fixture/copy.js', ['copy.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET' });
      res.end('The local preview never accepts booking submissions.');
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/reservation-widget/access/') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      });
      const slug = url.searchParams.get('restaurant');
      res.end(
        JSON.stringify({
          status:
            slug === 'blocked'
              ? 'origin_not_allowed'
              : slug === 'unavailable'
                ? 'unavailable'
                : 'allowed',
        }),
      );
      return;
    }
    if (url.pathname === '/health') {
      res.writeHead(200);
      res.end('local fixture');
      return;
    }
    const asset = assets.get(url.pathname);
    if (asset) {
      const contents = await readFile(new URL(`./fixture/${asset[0]}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' });
      res.end(contents);
      return;
    }
    const match = url.pathname.match(/^\/embed\/reservations\/([a-zA-Z0-9_-]{1,160})\/$/);
    if (
      !match ||
      match[1] === 'unavailable' ||
      !allowedParents.has(url.searchParams.get('parentOrigin'))
    ) {
      res.writeHead(404);
      res.end('Fixture unavailable');
      return;
    }
    if (match[1] === 'blocked') {
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      });
      res.end('<!doctype html><title>Unapproved site fixture</title>');
      return;
    }
    const page = await readFile(new URL('./fixture/preview.html', import.meta.url));
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self'; form-action 'none'; frame-ancestors ${[...allowedParents].join(' ')}`,
    });
    res.end(page);
  } catch {
    res.writeHead(500);
    res.end('The local preview could not be loaded.');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Local iframe fixture: http://127.0.0.1:${port}`),
);
process.once('SIGTERM', () => server.close(() => process.exit(0)));
process.once('SIGINT', () => server.close(() => process.exit(0)));
