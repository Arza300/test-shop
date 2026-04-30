export function extractR2KeyFromUrl(url: string): string | null {
  if (url.startsWith("r2:///")) {
    const parts = url.replace("r2:///", "").split("/");
    if (parts.length < 2) return null;
    return parts.slice(1).join("/");
  }

  const pathStyle = url.match(/^https:\/\/([^.]+)\.r2\.cloudflarestorage\.com\/([^/]+)\/(.+)$/i);
  if (pathStyle) {
    return pathStyle[3];
  }

  const virtualHost = url.match(/^https:\/\/([^.]+)\.[^.]+\.r2\.cloudflarestorage\.com\/(.+)$/i);
  if (virtualHost) {
    return virtualHost[2];
  }

  return null;
}

export function resolveImageUrlForClient(url?: string | null): string | null | undefined {
  if (!url) return url;
  const r2Key = extractR2KeyFromUrl(url);
  if (!r2Key) return url;
  return `/api/r2-object?key=${encodeURIComponent(r2Key)}`;
}

/** next/image can mishandle same-origin /api URLs with query strings; skip optimizer. */
export function shouldUnoptimizeImageSrc(src: string): boolean {
  return src.includes("/api/r2-object");
}

const PLACEHOLDER_PATH = "/placeholder.svg";

/** Shop/cart use the first image; skip default placeholder if a real image exists. */
export function pickCardImageUrl(urls: (string | null | undefined)[]): string | undefined {
  const list = urls.filter((u): u is string => Boolean(u));
  const real = list.find((u) => u !== PLACEHOLDER_PATH);
  return real ?? list[0];
}
