export function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
    </svg>
  );
}

export function ExternalIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3h7v7M13 3L6 10" />
    </svg>
  );
}

export function ChevronIcon({ expanded }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{
        transition: "transform 0.3s ease",
        transform: expanded ? "rotate(180deg)" : "rotate(0)",
      }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
