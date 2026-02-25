/**
 * Shared utility functions for the TMC Catalyst Tracker.
 */

// ─── Time Helpers ───

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function isRecentlyUpdated(dateStr, thresholdHours = 48) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < thresholdHours * 3600000;
}

export function formatScanDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" });
  return `${date} · ${time}`;
}

// ─── Style Maps ───

export const CATEGORY_COLORS = {
  regulatory: { text: "#38bdf8", bg: "rgba(56,189,248,0.08)" },
  corporate:  { text: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  market:     { text: "#34d399", bg: "rgba(52,211,153,0.08)" },
  policy:     { text: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
};

export const STATUS_COLORS = {
  pending: "#fbbf24",
  upcoming: "#38bdf8",
  in_progress: "#2dd4bf",
  completed: "#34d399",
  cancelled: "#f87171",
};

export const IMPACT_STYLES = {
  critical: { color: "#f87171", bg: "rgba(248,113,113,0.08)" },
  high:     { color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
  medium:   { color: "#7a8ba8", bg: "rgba(74,88,116,0.12)" },
  low:      { color: "#4a5874", bg: "rgba(74,88,116,0.08)" },
};

export const RANK_STYLES = {
  1: { color: "#f87171", border: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.08)" },
  2: { color: "#fbbf24", border: "rgba(251,191,36,0.25)",  bg: "rgba(251,191,36,0.08)" },
  3: { color: "#fbbf24", border: "rgba(251,191,36,0.2)",   bg: "rgba(251,191,36,0.06)" },
};

export const DEFAULT_RANK_STYLE = {
  color: "#7a8ba8",
  border: "rgba(56,189,248,0.08)",
  bg: "rgba(56,189,248,0.04)",
};

export const STATUS_LABELS = {
  pending: "Pending",
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const IMPACT_LABELS = {
  critical: "Critical",
  high: "High Impact",
  medium: "Medium Impact",
  low: "Lower Impact",
};
