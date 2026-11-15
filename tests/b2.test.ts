import { expect, test } from "bun:test";
import { b2KeyFromProxyUrl, isB2ObjectKey, isB2ProxyImageUrl } from "../lib/b2";
import { isManagedImageUrl } from "../lib/image-utils";

test("accepts only safe diary and album B2 object keys", () => {
  expect(isB2ObjectKey("diary/2026/11/photo.webp")).toBe(true);
  expect(isB2ObjectKey("album/2026/11/photo-1.webp")).toBe(true);
  expect(isB2ObjectKey("album/2026/11/../secret.webp")).toBe(false);
  expect(isB2ObjectKey("album/2026/11/photo.svg")).toBe(false);
});

test("recognizes the internal diary image proxy without accepting query injection", () => {
  const url = "/api/media?key=diary%2F2026%2F11%2Fphoto.webp";
  expect(isB2ProxyImageUrl(url)).toBe(true);
  expect(b2KeyFromProxyUrl(url)).toBe("diary/2026/11/photo.webp");
  expect(isManagedImageUrl(url)).toBe(true);
  expect(isB2ProxyImageUrl(`${url}&redirect=https://evil.example`)).toBe(false);
  expect(isB2ProxyImageUrl("/api/media?key=album%2F2026%2F11%2Fprivate.webp")).toBe(false);
});
