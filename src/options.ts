import { languages, type ReservationWidgetOptions, type WidgetConfiguration } from './types.js';
import { resolveRestaurantSlug } from './restaurant.js';
export const MENUEQR_ORIGIN = 'https://www.menueqr.de';
function fail(message: string): never {
  throw new TypeError(`MenüQR: ${message}`);
}
function integer(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
  key: string,
): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < min || value > max)
    fail(`${key} must be an integer from ${min} to ${max}.`);
  return value;
}
export function normalizeOptions(input: ReservationWidgetOptions): WidgetConfiguration {
  if (!input || typeof input !== 'object') fail('Options are required.');
  const {
    restaurant,
    mode = 'button',
    language = 'de',
    color = '#ff730a',
    side = 'right',
    label = '',
    nonce = '',
    mobile = true,
    icon = true,
  } = input;
  const slug = resolveRestaurantSlug(restaurant);
  if (!['button', 'floating', 'tab', 'inline'].includes(mode))
    fail('Unknown mode. Use button, floating, tab or inline.');
  if (!(languages as readonly string[]).includes(language))
    fail('Unknown language. Use de, en, fr, it, es, pt, pl, uk or tr.');
  if (typeof color !== 'string' || !/^#[a-f\d]{6}$/i.test(color))
    fail('color must be a six-digit hex color.');
  if (!['left', 'right'].includes(side)) fail('side must be left or right.');
  if (typeof label !== 'string' || label.length > 120)
    fail('label must be a string of at most 120 characters.');
  if (typeof nonce !== 'string' || nonce.length > 256)
    fail('nonce must be a string of at most 256 characters.');
  if (typeof mobile !== 'boolean' || typeof icon !== 'boolean')
    fail('mobile and icon must be booleans.');
  for (const key of ['onOpen', 'onReady', 'onClose'] as const)
    if (input[key] !== undefined && typeof input[key] !== 'function')
      fail(`${key} must be a function.`);
  let origin: URL;
  try {
    origin = new URL(input.baseUrl ?? MENUEQR_ORIGIN);
  } catch {
    return fail('baseUrl must be an absolute URL.');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== '/' ||
    !['http:', 'https:'].includes(origin.protocol) ||
    (origin.origin !== MENUEQR_ORIGIN &&
      !(loopback && ['http:', 'https:'].includes(origin.protocol)))
  )
    fail('baseUrl must be the MenüQR production origin or a loopback HTTP(S) origin.');
  return Object.freeze({
    restaurant: slug,
    mode,
    language,
    color: color.toLowerCase(),
    side,
    label: label.trim(),
    nonce,
    mobile,
    icon,
    offsetX: integer(input.offsetX, 24, 0, 96, 'offsetX'),
    offsetY: integer(input.offsetY, 24, 0, 160, 'offsetY'),
    inlineHeight: integer(input.inlineHeight, 720, 240, 1600, 'inlineHeight'),
    baseUrl: origin.origin,
    onOpen: input.onOpen,
    onReady: input.onReady,
    onClose: input.onClose,
  });
}
export function foreground(color: string): string {
  const channels = [1, 3, 5].map((i) => {
    const n = parseInt(color.slice(i, i + 2), 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
}
export function frameUrl(options: WidgetConfiguration, parentOrigin: string): string {
  const url = new URL(
    `/embed/reservations/${encodeURIComponent(options.restaurant)}/`,
    options.baseUrl,
  );
  url.search = new URLSearchParams({
    lang: options.language,
    color: options.color,
    parentOrigin,
    mode: options.mode === 'inline' ? 'inline' : 'modal',
  }).toString();
  return url.href;
}
