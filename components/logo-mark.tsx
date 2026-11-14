export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g fill="currentColor">
        <ellipse cx="22" cy="10" rx="5" ry="9" />
        <ellipse cx="22" cy="34" rx="5" ry="9" />
        <ellipse cx="10" cy="22" rx="9" ry="5" />
        <ellipse cx="34" cy="22" rx="9" ry="5" />
        <ellipse
          cx="13.5"
          cy="13.5"
          rx="5"
          ry="9"
          transform="rotate(-45 13.5 13.5)"
        />
        <ellipse
          cx="30.5"
          cy="30.5"
          rx="5"
          ry="9"
          transform="rotate(-45 30.5 30.5)"
        />
        <ellipse
          cx="30.5"
          cy="13.5"
          rx="5"
          ry="9"
          transform="rotate(45 30.5 13.5)"
        />
        <ellipse
          cx="13.5"
          cy="30.5"
          rx="5"
          ry="9"
          transform="rotate(45 13.5 30.5)"
        />
      </g>
      <circle cx="22" cy="22" r="5.5" fill="var(--surface)" />
    </svg>
  );
}
