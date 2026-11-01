import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const port = Number(process.env.WIDGET_PLAYGROUND_PORT ?? 4310);
const fixturePort = Number(process.env.WIDGET_FIXTURE_PORT ?? port + 1);
export default defineConfig({
  root: 'playground',
  plugins: [
    {
      name: 'local-csp-harness',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url ?? '/', 'http://localhost');
          if (url.pathname === '/harness.html' && url.searchParams.get('csp') === 'strict') {
            response.setHeader(
              'Content-Security-Policy',
              `default-src 'self'; script-src 'self'; style-src 'nonce-menueqr-local-csp-test'; style-src-attr 'none'; frame-src http://127.0.0.1:${fixturePort}; connect-src 'self' http://127.0.0.1:${fixturePort} ws://127.0.0.1:${port}; object-src 'none'; base-uri 'self'`,
            );
          }
          next();
        });
      },
    },
  ],
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __WIDGET_VERSION__: JSON.stringify(JSON.parse(readFileSync('package.json', 'utf8')).version),
    __FIXTURE_ORIGIN__: JSON.stringify(`http://127.0.0.1:${fixturePort}`),
  },
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] },
  },
});
