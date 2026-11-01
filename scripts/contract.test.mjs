import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { checkHostedContract } from './check-hosted-contract.mjs';

async function fixture(t, options = {}) {
  const parentOrigin = 'https://restaurant.example';
  const methods = [];
  const server = createServer((request, response) => {
    methods.push(request.method);
    const url = new URL(request.url, 'http://localhost');
    const diagnostic = url.pathname === '/api/reservation-widget/access/';
    const slug = diagnostic ? url.searchParams.get('restaurant') : url.pathname.split('/')[3];
    const status = {
      allowed: 'allowed',
      blocked: 'origin_not_allowed',
      unavailable: 'unavailable',
    }[slug];
    if (diagnostic) {
      assert.equal(url.searchParams.get('origin'), parentOrigin);
      assert.equal(request.headers.origin, parentOrigin);
      response.writeHead(options.diagnosticStatus ?? 200, {
        'Content-Type': 'application/json',
        ...(options.cors === false ? {} : { 'Access-Control-Allow-Origin': parentOrigin }),
      });
      response.end(JSON.stringify({ status: options.status ?? status }));
    } else {
      assert.equal(url.searchParams.get('parentOrigin'), parentOrigin);
      assert.equal(url.searchParams.get('mode'), 'modal');
      response.writeHead(slug === 'unavailable' ? (options.unavailableStatus ?? 404) : 200, {
        'Content-Type': 'text/html',
        ...(options.noCSP
          ? {}
          : {
              'Content-Security-Policy': `default-src 'self'; frame-ancestors ${slug === 'allowed' ? (options.allowedPolicy ?? parentOrigin) : slug === 'unavailable' ? (options.unavailablePolicy ?? "'none'") : (options.blockedPolicy ?? "'none'")}`,
            }),
        ...(options.xFrameOptions ? { 'X-Frame-Options': options.xFrameOptions } : {}),
      });
      response.end('<!doctype html><title>Local contract fixture</title>');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return {
    config: {
      baseUrl: `http://127.0.0.1:${server.address().port}`,
      parentOrigin,
      restaurants: { allowed: 'allowed', blocked: 'blocked', unavailable: 'unavailable' },
    },
    methods,
  };
}

test('checks allowed, origin-denied and unavailable contracts using GET requests only', async (t) => {
  const { config, methods } = await fixture(t);
  const results = await checkHostedContract(config);
  assert.deepEqual(
    results.map(({ status }) => status),
    ['allowed', 'origin_not_allowed', 'unavailable'],
  );
  assert.deepEqual(methods, Array(6).fill('GET'));
});

test('accepts an unavailable feature rendered as an HTML notice on an approved site', async (t) => {
  const { config } = await fixture(t, {
    unavailableStatus: 200,
    unavailablePolicy: 'https://restaurant.example',
  });
  const results = await checkHostedContract(config);
  assert.equal(results[2].status, 'unavailable');
  assert.equal(results[2].frameStatus, 200);
});

for (const [name, options, pattern] of [
  ['missing CORS', { cors: false }, /CORS/],
  ['missing frame-ancestors', { noCSP: true }, /CSP/],
  ['wildcard embedding', { allowedPolicy: 'https://restaurant.example *' }, /arbitrary websites/],
  [
    'blocked origin still permitted',
    { blockedPolicy: 'https://restaurant.example' },
    /deny embedding/,
  ],
  ['wrong diagnostic status', { status: 'unexpected' }, /diagnostic status/],
  ['failed diagnostic', { diagnosticStatus: 503 }, /endpoint/],
  ['failed unavailable service', { unavailableStatus: 500 }, /server failure/],
  ['X-Frame-Options blocks an approved origin', { xFrameOptions: 'SAMEORIGIN' }, /X-Frame-Options/],
]) {
  test(`rejects ${name}`, async (t) => {
    const { config } = await fixture(t, options);
    await assert.rejects(checkHostedContract(config), pattern);
  });
}

test('rejects credentials and unsafe URLs before any network request', async () => {
  let requested = false;
  await assert.rejects(
    checkHostedContract(
      {
        baseUrl: 'https://user:secret@example.com',
        parentOrigin: 'https://restaurant.example',
        restaurants: {},
      },
      () => {
        requested = true;
      },
    ),
    /credentials/,
  );
  assert.equal(requested, false);
});
