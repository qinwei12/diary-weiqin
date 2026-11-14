import { renderMarkdown } from "@/lib/markdown";

export function MarkdownBody({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={`markdown-body${className ? ` ${className}` : ""}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
