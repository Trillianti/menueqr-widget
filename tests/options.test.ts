import { describe, expect, it } from 'vitest';
import { foreground, frameUrl, MENUEQR_ORIGIN, normalizeOptions } from '../src/options.js';
import { defineReservationsElement } from '../src/element.js';
import { mountReservations } from '../src/index.js';
describe('configuration boundary', () => {
  it('has SSR-safe exports and a clear browser-only mount boundary', () => {
    expect(defineReservationsElement()).toBe(false);
    expect(() => mountReservations('#booking', { restaurant: 'bistro' })).toThrow(/browser/);
  });
  it('produces immutable defaults without account credentials', () => {
    const options = normalizeOptions({ restaurant: 'bistro-1' });
    expect(options).toMatchObject({
      mode: 'button',
      language: 'de',
      color: '#ff730a',
      side: 'right',
      baseUrl: MENUEQR_ORIGIN,
    });
    expect(Object.isFrozen(options)).toBe(true);
  });
  it.each([
    'https://evil.example',
    'https://www.menueqr.de@evil.example',
    'https://www.menueqr.de/x',
    'https://www.menueqr.de/?x=1',
    'https://www.menueqr.de/#x',
    'http://www.menueqr.de',
    'http://localhost.evil.example',
    'javascript:alert(1)',
  ])('rejects untrusted base URL %s', (baseUrl) => {
    expect(() => normalizeOptions({ restaurant: 'bistro', baseUrl })).toThrow(/baseUrl/);
  });
  it.each([
    'http://127.0.0.1:4311',
    'http://localhost:4311',
    'https://localhost:4311',
    'http://[::1]:4311',
  ])('permits explicit local fixture %s', (baseUrl) => {
    expect(normalizeOptions({ restaurant: 'bistro', baseUrl }).baseUrl).toBe(baseUrl);
  });
  it.each([
    { restaurant: '../escape' },
    { restaurant: 'bistro', color: 'red' },
    { restaurant: 'bistro', offsetX: -1 },
    { restaurant: 'bistro', offsetY: 161 },
    { restaurant: 'bistro', inlineHeight: 0 },
    { restaurant: 'bistro', mode: 'evil' },
    { restaurant: 'bistro', language: 'ua' },
    { restaurant: 'bistro', onReady: 'script' },
  ])('rejects invalid options before mounting: %j', (input) => {
    expect(() => normalizeOptions(input as never)).toThrow(TypeError);
  });
  it('builds only the published iframe protocol and encodes the parent origin', () => {
    const options = normalizeOptions({
      restaurant: 'bistro-1',
      mode: 'inline',
      language: 'en',
      color: '#AA3300',
    });
    const url = new URL(frameUrl(options, 'https://restaurant.example'));
    expect(url.pathname).toBe('/embed/reservations/bistro-1/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      lang: 'en',
      color: '#aa3300',
      parentOrigin: 'https://restaurant.example',
      mode: 'inline',
    });
  });
  it.each(['#ffffff', '#000000', '#ff730a', '#777777', '#35634b'])(
    'uses contrasting foreground for %s',
    (color) => {
      const chosen = foreground(color);
      expect(['#000000', '#ffffff']).toContain(chosen);
      const channels = [1, 3, 5].map((i) => {
        const c = parseInt(color.slice(i, i + 2), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      const l = channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
      expect(chosen === '#000000' ? (l + 0.05) / 0.05 : 1.05 / (l + 0.05)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );
});
