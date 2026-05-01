/** يُبنى رابط الاتصال من النص المعروض (أرقام و + ومسافات). */
export function supportPhoneToTelHref(display: string): string | null {
  const compact = display.trim().replace(/\s/g, "");
  if (!compact) return null;
  return `tel:${compact}`;
}
