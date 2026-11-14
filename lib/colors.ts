export type RGB = { r: number; g: number; b: number };

export type Palette = {
  colors: string[];
  accent: string;
};

const clamp = (value: number, min = 0, max = 255) =>
  Math.min(max, Math.max(min, value));

export function rgbToHex({ r, g, b }: RGB): string {
  const channel = (value: number) =>
    clamp(Math.round(value)).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function mix(a: string, b: string, t: number): string {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex({
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  });
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function saturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  if (max === min) return 0;
  const delta = max - min;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

export function colorDistance(a: string, b: string): number {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  return Math.sqrt(
    (first.r - second.r) ** 2 +
      (first.g - second.g) ** 2 +
      (first.b - second.b) ** 2,
  );
}

/**
 * Quantizes raw RGBA pixels into a small, distance-filtered palette.
 * Pure function so the same ordering is used on the server and in previews.
 */
export function paletteFromPixels(
  pixels: ArrayLike<number>,
  options: { count?: number; channels?: number; step?: number } = {},
): string[] {
  const { count = 6, channels = 4, step = 3 } = options;
  const stride = Math.max(1, step) * channels;
  const buckets = new Map<
    number,
    { r: number; g: number; b: number; weight: number }
  >();

  for (let index = 0; index + channels <= pixels.length; index += stride) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const alpha = channels === 4 ? pixels[index + 3] : 255;
    if (alpha < 128) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 510;
    // Very light and very dark pixels still matter to the UI, just less often.
    const weight = lightness > 0.94 || lightness < 0.05 ? 0.4 : 1;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r * weight;
      bucket.g += g * weight;
      bucket.b += b * weight;
      bucket.weight += weight;
    } else {
      buckets.set(key, { r: r * weight, g: g * weight, b: b * weight, weight });
    }
  }

  const candidates = [...buckets.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 40)
    .map((bucket) =>
      rgbToHex({
        r: bucket.r / bucket.weight,
        g: bucket.g / bucket.weight,
        b: bucket.b / bucket.weight,
      }),
    );

  const palette: string[] = [];
  for (const color of candidates) {
    if (palette.every((picked) => colorDistance(picked, color) > 46)) {
      palette.push(color);
    }
    if (palette.length >= count) break;
  }

  return palette.length > 0 ? palette : ["#e8734a", "#f4ece1", "#2b2320"];
}

/**
 * Picks a color from an image palette that works as a UI accent: present in
 * the picture, colorful, and not so dark or pale that it disappears.
 */
export function pickAccent(colors: string[]): string {
  const fallback = colors.find((color) => {
    const light = luminance(color);
    return light > 0.04 && light < 0.8;
  });

  // Mid-tone, saturated pixels make the best accent. A pale blush may be the
  // most chromatic color in an illustration, but it is a poor UI color.
  const scored = colors
    .map((color) => {
      const light = luminance(color);
      const score = saturation(color) * (1 - Math.abs(light - 0.32) * 1.8);
      return { color, score };
    })
    .sort((a, b) => b.score - a.score);

  const accent = scored[0];
  if (accent && accent.score > 0.3) return accent.color;
  return fallback ?? colors[0] ?? "#e8734a";
}

export type Theme = {
  accent: string;
  accentInk: string;
  onAccent: string;
  palette: string[];
};

export function themeFromPalette(colors: string[]): Theme {
  const palette = paletteToTheme(colors);
  const onAccent =
    contrastRatio("#241710", palette.accent) >= 3.4 ? "#241710" : "#fffaf2";
  return {
    accent: palette.accent,
    accentInk: accentInk(palette.accent),
    onAccent,
    palette: palette.colors,
  };
}

/** A darker version of the accent that is safe for small text on paper. */
export function accentInk(accent: string): string {
  let ink = mix(accent, "#241710", 0.42);
  let guard = 0;
  while (contrastRatio(ink, "#f7f0e6") < 4.4 && guard < 8) {
    ink = mix(ink, "#1d120d", 0.12);
    guard += 1;
  }
  return ink;
}

export function paletteToTheme(colors: string[]): Palette {
  const accent = pickAccent(colors);
  return {
    accent,
    colors: [accent, ...colors.filter((color) => color !== accent)].slice(0, 6),
  };
}
