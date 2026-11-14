import { Marked } from "marked";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(raw: string, kind: "link" | "image"): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (kind === "link" && value.startsWith("mailto:")) {
    return /^mailto:[^\s<>"']+$/i.test(value) ? value : null;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return value;
    }
  } catch {
    // Relative links without a leading slash are resolved by the browser.
    if (
      !value.startsWith("//") &&
      /^[a-zA-Z0-9._~!$&'()*+,;=:@%/-]+(?:\?[^\s]*)?(?:#[^\s]*)?$/.test(value)
    ) {
      return value;
    }
  }
  return null;
}

function slugify(value: string): string {
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-zA-Z]+;/g, " ")
    .normalize("NFKC")
    .toLowerCase()
    .trim();

  const slug = text
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

function createMarked() {
  const slugs = new Map<string, number>();
  const marked = new Marked({
    gfm: true,
    breaks: true,
  });

  marked.use({
    renderer: {
      html(token) {
        return escapeHtml(token.text);
      },
      heading({ tokens, depth }) {
        const label = this.parser.parseInline(tokens);
        const base = slugify(label);
        const count = (slugs.get(base) ?? 0) + 1;
        slugs.set(base, count);
        const id = count === 1 ? base : `${base}-${count}`;
        return `<h${depth} id="${escapeHtml(id)}">${label}</h${depth}>`;
      },
      code({ text, lang }) {
        const language = lang?.trim().split(/\s+/)[0];
        const className = language
          ? ` class="language-${escapeHtml(language)}"`
          : "";
        return `<div class="code-block"><button type="button" class="code-copy" data-code-copy aria-label="复制代码">复制</button><pre><code${className}>${escapeHtml(text)}</code></pre></div>`;
      },
      link(token) {
        const href = safeUrl(token.href, "link");
        const label = this.parser.parseInline(token.tokens);
        if (!href) return label;
        const external = /^(https?:)?\/\//i.test(href);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        const rel = external
          ? ' target="_blank" rel="noopener noreferrer"'
          : "";
        return `<a href="${escapeHtml(href)}"${title}${rel}>${label}</a>`;
      },
      image(token) {
        const src = safeUrl(token.href, "image");
        const alt = escapeHtml(token.text || "");
        if (!src) return alt;
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return `<img src="${escapeHtml(src)}" alt="${alt}"${title} loading="lazy" decoding="async" />`;
      },
    },
  });

  return marked;
}

export function renderMarkdown(markdown: string): string {
  if (!markdown.trim()) return "";
  return createMarked().parse(markdown, { async: false }) as string;
}
