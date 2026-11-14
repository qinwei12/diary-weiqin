export const FEED_PAGE_SIZE = 10;
export const MAX_FEED_LIMIT = 100;

export function normalizeFeedLimit(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < FEED_PAGE_SIZE) return FEED_PAGE_SIZE;
  const rounded = Math.ceil(parsed / FEED_PAGE_SIZE) * FEED_PAGE_SIZE;
  return Math.min(MAX_FEED_LIMIT, rounded);
}

export function buildFeedHref({
  q,
  tag,
  limit,
}: {
  q?: string | null;
  tag?: string | null;
  limit?: number;
}): string {
  const params = new URLSearchParams();
  const query = q?.trim();
  if (query) params.set("q", query);
  if (tag) params.set("tag", tag);
  if (limit && limit > FEED_PAGE_SIZE) {
    params.set("limit", String(Math.min(MAX_FEED_LIMIT, limit)));
  }
  const search = params.toString();
  return `/${search ? `?${search}` : ""}#feed`;
}
