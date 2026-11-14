"use client";

import { useEffect } from "react";

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function CopyCodeHandler() {
  useEffect(() => {
    async function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>("[data-code-copy]");
      if (!button) return;

      const block = button.closest(".code-block");
      const code = block?.querySelector("pre code")?.textContent ?? "";
      if (!code) return;

      try {
        await copyText(code);
        button.textContent = "已复制";
      } catch {
        button.textContent = "复制失败";
      }

      window.setTimeout(() => {
        if (button.isConnected) button.textContent = "复制";
      }, 1600);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
