import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function serviceOrigin(value) {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  assert(
    !url.username && !url.password && !url.search && !url.hash && url.pathname === '/',
    'Use an origin without credentials, paths or query strings.',
  );
  assert(
    url.protocol === 'https:' || (loopback && url.protocol === 'http:'),
    'Use HTTPS or a loopback HTTP fixture.',
  );
  return url.origin;
}

function ancestors(response) {
  return (
    response.headers
      .get('content-security-policy')
      ?.split(';')
      .map((directive) => directive.trim())
      .find((directive) => /^frame-ancestors\s/i.test(directive))
      ?.split(/\s+/)
      .slice(1) ?? []
  );
}

/** Read-only GET checks; no booking requests, cookies, credentials or guest data. */
export async function checkHostedContract({ baseUrl, parentOrigin, restaurants }, request = fetch) {
  const base = serviceOrigin(baseUrl);
  const parent = serviceOrigin(parentOrigin);
  assert.notEqual(base, parent, 'Use a cross-origin embedding website.');
  const cases = { allowed: 'allowed', blocked: 'origin_not_allowed', unavailable: 'unavailable' };
  const results = [];
  for (const [scenario, expected] of Object.entries(cases)) {
    const restaurant = restaurants[scenario];
    assert(
      typeof restaurant === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(restaurant),
      `Set a public test restaurant slug for ${scenario}.`,
    );
    const options = {
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(10000),
    };
    const diagnostic = new URL('/api/reservation-widget/access/', base);
    diagnostic.search = new URLSearchParams({ restaurant, origin: parent }).toString();
    const response = await request(diagnostic, { ...options, headers: { Origin: parent } });
    assert(response.ok, `${scenario}: diagnostic endpoint did not return success.`);
    const cors = response.headers.get('access-control-allow-origin');
    assert(
      cors === '*' || cors === parent,
      `${scenario}: diagnostics do not allow the embedding origin through CORS.`,
    );
    const status = (await response.json())?.status;
    assert(status === expected, `${scenario}: unexpected diagnostic status.`);
    const frame = new URL(`/embed/reservations/${encodeURIComponent(restaurant)}/`, base);
    frame.search = new URLSearchParams({
      lang: 'en',
      color: '#ff730a',
      parentOrigin: parent,
      mode: 'modal',
    }).toString();
    const embedded = await request(frame, options);
    if (scenario === 'allowed') {
      assert(embedded.ok, 'allowed: the reservation frame did not load.');
      assert.match(
        embedded.headers.get('content-type') ?? '',
        /^text\/html\b/i,
        'allowed: expected an HTML frame.',
      );
      const policy = ancestors(embedded);
      assert(
        policy.includes(parent),
        'allowed: CSP does not explicitly approve the embedding origin.',
      );
      assert(
        !policy.some((source) => source.includes('*') || /^[a-z]+:$/i.test(source)),
        'allowed: frame-ancestors must not permit arbitrary websites.',
      );
      assert(
        !/^(DENY|SAMEORIGIN)$/i.test(embedded.headers.get('x-frame-options') ?? ''),
        'allowed: X-Frame-Options blocks cross-origin embedding.',
      );
    } else if (scenario === 'blocked' && embedded.ok) {
      const policy = ancestors(embedded);
      assert(
        policy.length > 0 &&
          !policy.includes(parent) &&
          !policy.some((source) => source.includes('*') || /^[a-z]+:$/i.test(source)),
        `${scenario}: a successful response must deny embedding this origin.`,
      );
    } else if (!embedded.ok) {
      assert(
        [403, 404, 410].includes(embedded.status),
        `${scenario}: expected an access denial, not a server failure.`,
      );
    } else {
      // Unavailable features may render a neutral notice on an approved website.
      assert.match(
        embedded.headers.get('content-type') ?? '',
        /^text\/html\b/i,
        'unavailable: expected an HTML notice.',
      );
    }
    results.push({ scenario, status, frameStatus: embedded.status });
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const baseUrl = process.env.WIDGET_CONTRACT_BASE_URL;
  const parentOrigin = process.env.WIDGET_CONTRACT_PARENT_ORIGIN;
  assert(
    baseUrl && parentOrigin,
    'Set WIDGET_CONTRACT_BASE_URL and WIDGET_CONTRACT_PARENT_ORIGIN; no live service is selected by default.',
  );
  const results = await checkHostedContract({
    baseUrl,
    parentOrigin,
    restaurants: {
      allowed: process.env.WIDGET_CONTRACT_ALLOWED,
      blocked: process.env.WIDGET_CONTRACT_BLOCKED,
      unavailable: process.env.WIDGET_CONTRACT_UNAVAILABLE,
    },
  });
  console.log(JSON.stringify(results, null, 2));
}
