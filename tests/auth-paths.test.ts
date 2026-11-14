import { describe, expect, test } from "bun:test";
import { safeNextPath } from "../lib/auth-paths";

describe("safeNextPath", () => {
  test("keeps internal paths", () => {
    expect(safeNextPath("/compose")).toBe("/compose");
    expect(safeNextPath("/posts/2026-10-27-dusk?from=feed#top")).toBe(
      "/posts/2026-10-27-dusk?from=feed#top",
    );
    expect(safeNextPath("/account?first=1")).toBe("/account?first=1");
  });

  test("rejects external and protocol-relative targets", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });

  test("avoids login loops and API targets", () => {
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/login?next=/account")).toBe("/");
    expect(safeNextPath("/api/upload")).toBe("/");
  });

  test("uses a custom fallback", () => {
    expect(safeNextPath(undefined, "/account")).toBe("/account");
  });
});
