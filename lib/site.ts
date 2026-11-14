import { themeFromPalette, type Theme } from "./colors";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const SITE = {
  name: "Quiet Wisp",
  chineseName: "清微",
  english: "QUIET WISP",
  subtitle: "清微 · 随晚风",
  author: "清微",
  tagline: "清微随晚风，温月入云丛。",
  description:
    "一个存放晚风、月光和一点点心事的安静角落。用文字、图片与 Markdown，把普通的一天轻轻收好。",
  url: siteUrl,
  startYear: 2026,
};

export type SitePalette = {
  id: string;
  name: string;
  note: string;
  theme: Theme;
};

const basePalettes = [
  {
    id: "coral",
    name: "珊瑚橘",
    note: "取自新头像 · 明亮、轻快",
    colors: ["#f48251", "#000000", "#feebe2", "#c45635", "#352c2b", "#fec9bb"],
  },
  {
    id: "tangerine",
    name: "蜜橘色",
    note: "取自贴纸插画 · 暖暖的甜",
    colors: ["#ef7e57", "#fefefe", "#cc5a3a", "#1e1b1a", "#fddeda", "#423d3d"],
  },
  {
    id: "amber",
    name: "琥珀棕",
    note: "取自全身像 · 安静的秋日",
    colors: ["#cc6b43", "#e3ccc3", "#3c2c2a", "#bc9d93", "#a4533a", "#93746b"],
  },
  {
    id: "terracotta",
    name: "陶土红",
    note: "取自裙摆特写 · 一抹复古",
    colors: ["#cb5c35", "#e4ccc3", "#332624", "#bb9c93", "#94746b"],
  },
] as const;

export const SITE_PALETTES: SitePalette[] = basePalettes.map((palette) => ({
  id: palette.id,
  name: palette.name,
  note: palette.note,
  theme: themeFromPalette([...palette.colors]),
}));

export const DEFAULT_THEME = SITE_PALETTES[0].theme;

export const MOODS = [
  { emoji: "🌿", label: "平静" },
  { emoji: "🍊", label: "愉快" },
  { emoji: "📖", label: "沉浸" },
  { emoji: "🍵", label: "松弛" },
  { emoji: "🌧️", label: "微丧" },
  { emoji: "✨", label: "心动" },
  { emoji: "🌙", label: "疲惫" },
  { emoji: "🔥", label: "有劲" },
  { emoji: "🐈", label: "慵懒" },
  { emoji: "🌼", label: "雀跃" },
] as const;

export const WEATHERS = [
  "晴",
  "多云",
  "阴",
  "小雨",
  "大雨",
  "雪",
  "雾",
  "夜风",
] as const;

export function moodLabel(emoji: string): string {
  return MOODS.find((mood) => mood.emoji === emoji)?.label ?? "当时";
}
