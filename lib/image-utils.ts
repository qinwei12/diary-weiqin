import path from "node:path";

export const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads");
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export function isManagedImageUrl(url: string): boolean {
  return /^\/(?:uploads|images)\/[a-zA-Z0-9._-]+$/.test(url) || isStorageProxyImageUrl(url);
}

function isStorageProxyImageUrl(value: string): boolean {
  try {
    const url = new URL(value, "https://local.invalid");
    const key = url.searchParams.get("key");
    return url.pathname === "/api/media" && Boolean(key) && url.searchParams.toString() === `key=${encodeURIComponent(key!)}` &&
      /^diary\/\d{4}\/\d{2}\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp|avif)$/.test(key!);
  } catch {
    return false;
  }
}

export function absoluteImagePath(url: string): string | null {
  if (!isManagedImageUrl(url)) return null;
  if (!url.startsWith("/")) return null;
  const relative = url.replace(/^\//, "");
  const resolved = path.resolve(process.cwd(), "public", relative);
  const publicRoot = path.resolve(process.cwd(), "public");
  if (!resolved.startsWith(publicRoot + path.sep)) return null;
  return resolved;
}

export function sniffImageFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  if (
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))
  ) {
    return "avif";
  }

  return null;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizePalette(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const colors = new Set<string>();
  for (const item of value) {
    if (!isHexColor(item)) continue;
    colors.add(item.toLowerCase());
    if (colors.size >= 6) break;
  }
  return colors.size > 0 ? [...colors] : null;
}

export function normalizeDimensions(
  width: unknown,
  height: unknown,
): { width: number; height: number } | null {
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }
  const safeWidth = Math.round(width);
  const safeHeight = Math.round(height);
  if (
    safeWidth < 1 ||
    safeHeight < 1 ||
    safeWidth > 12_000 ||
    safeHeight > 12_000 ||
    safeWidth * safeHeight > MAX_IMAGE_PIXELS
  ) {
    return null;
  }
  return { width: safeWidth, height: safeHeight };
}

export function extensionFor(format: ImageFormat): string {
  return format === "jpeg" ? "jpg" : format;
}
