import { afterEach, expect, test } from "bun:test";
import { isManagedImageUrl } from "../lib/image-utils";
import { getUpyunPublicBaseUrl, isUpyunImageUrl } from "../lib/upyun";

const originalBaseUrl = process.env.UPYUN_PUBLIC_BASE_URL;
afterEach(() => {
  if (originalBaseUrl === undefined) delete process.env.UPYUN_PUBLIC_BASE_URL;
  else process.env.UPYUN_PUBLIC_BASE_URL = originalBaseUrl;
});

test("restricts hosted image URLs to the configured HTTPS bucket and diary path", () => {
  process.env.UPYUN_PUBLIC_BASE_URL = "https://image-quiet-wisp.b0.aicdn.com/";
  expect(getUpyunPublicBaseUrl()).toBe("https://image-quiet-wisp.b0.aicdn.com");
  expect(isUpyunImageUrl("https://image-quiet-wisp.b0.aicdn.com/diary/2026/11/abc-123.webp")).toBe(true);
  expect(isManagedImageUrl("https://image-quiet-wisp.b0.aicdn.com/diary/2026/11/abc-123.webp")).toBe(true);
  expect(isUpyunImageUrl("https://other.example/diary/2026/11/abc-123.webp")).toBe(false);
  expect(isUpyunImageUrl("http://image-quiet-wisp.b0.aicdn.com/diary/2026/11/abc-123.webp")).toBe(false);
  expect(isUpyunImageUrl("https://image-quiet-wisp.b0.aicdn.com/diary/2026/11/../secret.webp")).toBe(false);
  expect(isManagedImageUrl("https://image-quiet-wisp.b0.aicdn.com/diary/2026/11/%2e%2e/secret.webp")).toBe(false);
  expect(isUpyunImageUrl("https://image-quiet-wisp.b0.aicdn.com/diary/2026/11/abc.webp?token=x")).toBe(false);
  expect(isUpyunImageUrl("https://image-quiet-wisp.b0.aicdn.com/avatar.webp")).toBe(false);
});
