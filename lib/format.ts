export const TIME_ZONE = "Asia/Shanghai";

const monthNames = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

const englishMonths = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

type DateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  weekday: string;
};

function parts(iso: string | Date): DateParts {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    weekday: map.weekday,
  };
}

export function dayKey(iso: string): string {
  const value = parts(iso);
  return `${value.year}-${value.month}-${value.day}`;
}

export function monthKey(iso: string): string {
  const value = parts(iso);
  return `${value.year}-${value.month}`;
}

export function formatDay(iso: string): string {
  return String(Number(parts(iso).day));
}

export function formatMonthCN(iso: string): string {
  const value = Number(parts(iso).month);
  return monthNames[value - 1] ?? `${value}月`;
}

export function formatMonthShort(iso: string): string {
  const value = Number(parts(iso).month);
  return englishMonths[value - 1] ?? "";
}

export function formatWeekday(iso: string): string {
  return parts(iso).weekday.replace("星期", "周");
}

export function formatTime(iso: string): string {
  const value = parts(iso);
  return `${value.hour}:${value.minute}`;
}

export function formatFullDate(iso: string): string {
  const value = parts(iso);
  return `${value.year} 年 ${Number(value.month)} 月 ${Number(value.day)} 日 · ${formatWeekday(iso)} · ${value.hour}:${value.minute}`;
}

export function formatYear(iso: string): string {
  return parts(iso).year;
}

export function formatMonthTitle(key: string): string {
  const [year, month] = key.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

export function formatMonthNote(key: string): string {
  const [year, month] = key.split("-");
  return `${englishMonths[Number(month) - 1] ?? ""} · ${year}`;
}

export function toDateTimeInputValue(iso?: string): string {
  const value = parts(iso ? new Date(iso) : new Date());
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function fromDateTimeInputValue(value: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00+08:00`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function wordCount(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~`\-]/g, " ");
  const cjk = plain.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latin = plain
    .replace(/[\u3400-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return cjk + latin;
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(wordCount(markdown) / 320));
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^\[[ xX]\]\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(markdown: string, limit = 150): string {
  const text = plainText(markdown);
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}
