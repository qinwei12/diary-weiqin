export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;

  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return fallback;
  if (
    path === "/login" ||
    path.startsWith("/login?") ||
    path.startsWith("/login#") ||
    path.startsWith("/api/")
  ) {
    return fallback;
  }

  return path;
}
