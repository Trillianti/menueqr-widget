import { expect, it } from 'vitest';
import { resolveRestaurantSlug } from '../src/restaurant.js';
import { normalizeOptions } from '../src/options.js';
it.each([
  ['bistro-lumi', 'bistro-lumi'],
  ['  bistro-lumi  ', 'bistro-lumi'],
  ['https://www.menueqr.de/menu/bistro-lumi/', 'bistro-lumi'],
  ['https://menueqr.de/menu/bistro-lumi/items/?lang=de#lunch', 'bistro-lumi'],
  ['https://www.menueqr.de/menu/bistro-lumi/reserve/', 'bistro-lumi'],
])('normalizes a public restaurant reference: %s', (input, slug) => {
  expect(resolveRestaurantSlug(input!)).toBe(slug);
  expect(normalizeOptions({ restaurant: input! }).restaurant).toBe(slug);
});
it.each([
  '',
  '../escape',
  'https://evil.example/menu/bistro/',
  'https://www.menueqr.de@evil.example/menu/bistro/',
  'https://user:pass@www.menueqr.de/menu/bistro/',
  'http://www.menueqr.de/menu/bistro/',
  'https://www.menueqr.de:444/menu/bistro/',
  'https://www.menueqr.de/dashboard/',
  'https://www.menueqr.de/menu/bistro/reservation/private-token/',
  'javascript:alert(1)',
])('rejects a foreign or private link: %s', (input) => {
  expect(() => resolveRestaurantSlug(input)).toThrow(/restaurant slug/);
});
