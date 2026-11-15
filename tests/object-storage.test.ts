import { expect, test } from "bun:test";
import { storageKeyFromProxyUrl, isStorageObjectKey, isStorageProxyImageUrl } from "../lib/object-storage";
import { isManagedImageUrl } from "../lib/image-utils";

test("accepts only safe diary and album object keys", () => {
  expect(isStorageObjectKey("diary/2026/11/photo.webp")).toBe(true);
  expect(isStorageObjectKey("album/2026/11/photo-1.webp")).toBe(true);
  expect(isStorageObjectKey("album/2026/11/../secret.webp")).toBe(false);
  expect(isStorageObjectKey("album/2026/11/photo.svg")).toBe(false);
});

test("recognizes the internal diary image proxy without accepting query injection", () => {
  const url = "/api/media?key=diary%2F2026%2F11%2Fphoto.webp";
  expect(isStorageProxyImageUrl(url)).toBe(true);
  expect(storageKeyFromProxyUrl(url)).toBe("diary/2026/11/photo.webp");
  expect(isManagedImageUrl(url)).toBe(true);
  expect(isStorageProxyImageUrl(`${url}&redirect=https://evil.example`)).toBe(false);
  expect(isStorageProxyImageUrl("/api/media?key=album%2F2026%2F11%2Fprivate.webp")).toBe(false);
});
