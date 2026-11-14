"use client";

import { toast } from "@/lib/toast";
import type { SitePalette } from "@/lib/site";
import { CheckIcon, PaletteIcon } from "./icons";
import { useDiaryTheme } from "./theme-provider";

export function PalettePicker({ palettes }: { palettes: SitePalette[] }) {
  const { theme, follow, source, applyTheme, setFollow } = useDiaryTheme();

  function choose(palette: SitePalette) {
    applyTheme(palette.theme, `「${palette.name}」色板`);
    setFollow(false);
    toast(`已换成「${palette.name}」配色`, "success");
  }

  function toggleFollow() {
    if (follow) {
      setFollow(false);
      toast("已固定当前配色");
    } else {
      setFollow(true);
      toast("开启啦，向下滚动试试看", "success");
    }
  }

  return (
    <div className="palette-picker">
      <div className="palette-picker__head">
        <span className="mini-label">
          <PaletteIcon size={15} />
          换一种颜色
        </span>
        <p>这些颜色都来自日记里的画，点一下就能让整个页面换一种心情。</p>
      </div>

      <div className="palette-options">
        {palettes.map((palette) => {
          const selected =
            theme.accent.toLowerCase() === palette.theme.accent.toLowerCase();
          return (
            <button
              key={palette.id}
              type="button"
              className={`palette-option${selected ? " is-selected" : ""}`}
              onClick={() => choose(palette)}
              aria-pressed={selected}
            >
              <span className="palette-option__dots" aria-hidden="true">
                {palette.theme.palette.slice(0, 4).map((color, index) => (
                  <span key={`${palette.id}-${color}-${index}`} style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="palette-option__copy">
                <strong>{palette.name}</strong>
                <small>{palette.note}</small>
              </span>
              <span className="palette-option__check" aria-hidden="true">
                {selected ? <CheckIcon size={14} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={follow}
        className={`follow-switch${follow ? " is-on" : ""}`}
        onClick={toggleFollow}
      >
        <span className="follow-switch__track" aria-hidden="true">
          <span className="follow-switch__thumb" />
        </span>
        <span className="follow-switch__copy">
          <strong>跟着配图换色</strong>
          <small>
            {follow
              ? source
                ? `正在跟随 ${source}`
                : "向下滚动，页面会跟着照片换色"
              : "开启后，滚动时自动读取配图的主色"}
          </small>
        </span>
      </button>
    </div>
  );
}
