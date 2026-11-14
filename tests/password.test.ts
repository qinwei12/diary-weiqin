import { describe, expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "../lib/password";

describe("password hashing", () => {
  test("stores a salted scrypt hash and verifies it", async () => {
    const hash = await hashPassword("12345");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("12345");
    expect(await verifyPassword("12345", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  test("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("12345", "not-a-hash")).toBe(false);
    expect(await verifyPassword("12345", "scrypt$salt$zzzz")).toBe(false);
  });
});
