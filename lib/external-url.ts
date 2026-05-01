/**
 * Accepts only http(s) URLs for safe use as link hrefs (rejects javascript:, data:, etc.).
 */
export function parseSafeHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function isSafeHttpUrlString(raw: string): boolean {
  return parseSafeHttpUrl(raw) !== null;
}
