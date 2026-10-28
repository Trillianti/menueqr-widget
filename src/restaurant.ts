const slugPattern = /^[a-zA-Z0-9_-]{1,160}$/;
/** Accept public menu links as a convenience, returning only the restaurant slug. */
export function resolveRestaurantSlug(value: string): string {
  const invalid = () => new TypeError('MenüQR: Enter a restaurant slug or a MenüQR menu link.');
  if (typeof value !== 'string') throw invalid();
  const input = value.trim();
  if (slugPattern.test(input)) return input;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw invalid();
  }
  if (
    !['https://www.menueqr.de', 'https://menueqr.de'].includes(url.origin) ||
    url.username ||
    url.password
  )
    throw invalid();
  const match = url.pathname.match(
    /^\/menu\/([a-zA-Z0-9_-]{1,160})(?:\/(?:items|reviews|reserve|info|checkout))?\/?$/,
  );
  if (!match) throw invalid();
  return match[1]!;
}
