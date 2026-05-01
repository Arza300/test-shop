import type { CSSProperties } from "react";

/** لون افتراضي للمعاينة في لوحة التحكم قبل اختيار لون مخصّص (#hsl تقريبي لـ violet) */
export const BRAND_PRIMARY_HEX_PREVIEW_FALLBACK = "#8b5cf6";

/** يقبل #RGB أو #RRGGBB أو RRGGBB بدون شباك */
export function parseBrandPrimaryHex(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withHash = t.startsWith("#") ? t : `#${t}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash)) return null;
  let h = withHash.slice(1);
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${h.toLowerCase()}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = parseBrandPrimaryHex(hex);
  if (!normalized) return null;
  const n = normalized.slice(1);
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return null;
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** سلسلات HSL بصيغة shadcn: "H S% L%" */
export function brandPrimaryHexToCssCustomProps(hex: string): Record<string, string> | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hR = Math.round(h);
  const sR = Math.round(Math.min(100, Math.max(0, s)));
  const lR = Math.round(Math.min(100, Math.max(0, l)));
  const primary = `${hR} ${sR}% ${lR}%`;
  const accentS = Math.round(Math.min(40, Math.max(14, sR * 0.45)));
  const accent = `${hR} ${accentS}% 18%`;
  const accentFg = `${hR} 24% 92%`;

  return {
    "--primary": primary,
    "--primary-foreground": "0 0% 100%",
    "--ring": primary,
    "--accent": accent,
    "--accent-foreground": accentFg,
  };
}

export function brandPrimaryHexToCssProperties(hex: string | null | undefined): CSSProperties | undefined {
  const t = hex?.trim();
  if (!t) return undefined;
  const normalized = parseBrandPrimaryHex(t);
  if (!normalized) return undefined;
  const props = brandPrimaryHexToCssCustomProps(normalized);
  if (!props) return undefined;
  return props as unknown as CSSProperties;
}
