import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "../lib/markdown";

describe("renderMarkdown", () => {
  test("escapes raw HTML", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("strips unsafe link and image protocols", () => {
    const html = renderMarkdown(
      "[危险](javascript:alert(1)) ![图](javascript:alert(1))",
    );
    expect(html).not.toContain("javascript:");
    expect(html).toContain("危险");
    expect(html).toContain("图");
  });

  test("keeps safe external links", () => {
    const html = renderMarkdown("[站点](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("adds unique heading anchors", () => {
    const html = renderMarkdown(
      "## 黄昏\n\n## 黄昏\n\n### Hello, World!",
    );
    expect(html).toContain('id="黄昏"');
    expect(html).toContain('id="黄昏-2"');
    expect(html).toContain('id="hello-world"');
  });

  test("adds copy buttons to fenced code", () => {
    const html = renderMarkdown("```js\nconst answer = 42;\n```");
    expect(html).toContain('class="code-block"');
    expect(html).toContain("data-code-copy");
    expect(html).toContain("language-js");
    expect(html).toContain("const answer = 42;");
  });
});
