import { useState } from "react";
import { CalendarIcon, ExternalIcon, ChevronIcon } from "./Icons";
import {
  timeAgo,
  isRecentlyUpdated,
  CATEGORY_COLORS,
  STATUS_COLORS,
  IMPACT_STYLES,
  RANK_STYLES,
  DEFAULT_RANK_STYLE,
  STATUS_LABELS,
  IMPACT_LABELS,
} from "../lib/utils";

export default function CatalystCard({ catalyst, animDelay = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const cat = CATEGORY_COLORS[catalyst.category] || CATEGORY_COLORS.corporate;
  const statusColor = STATUS_COLORS[catalyst.status] || "#7a8ba8";
  const impactStyle = IMPACT_STYLES[catalyst.impact] || IMPACT_STYLES.medium;
  const rankStyle = RANK_STYLES[catalyst.rank] || DEFAULT_RANK_STYLE;
  const recentlyUpdated = isRecentlyUpdated(catalyst.updated_at);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        animation: `fadeSlideIn 0.5s ease ${animDelay}s forwards`,
        opacity: 0,
        background: expanded ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: `1px solid ${recentlyUpdated ? "rgba(56,189,248,0.15)" : "var(--border)"}`,
        borderRadius: 12,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        boxShadow: recentlyUpdated ? "0 0 20px rgba(56,189,248,0.06)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.background = "var(--bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = recentlyUpdated
          ? "rgba(56,189,248,0.15)"
          : "var(--border)";
        if (!expanded) e.currentTarget.style.background = "var(--bg-card)";
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: cat.text,
          borderRadius: "3px 0 0 3px",
        }}
      />

      {/* ─── Collapsed Row ─── */}
      <div style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Rank badge */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Instrument Serif', serif",
            fontSize: "0.95rem",
            flexShrink: 0,
            border: `1px solid ${rankStyle.border}`,
            color: rankStyle.color,
            background: rankStyle.bg,
          }}
        >
          {catalyst.rank}
        </div>

        {/* Title area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 3, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "2px 7px",
                borderRadius: 4,
                fontWeight: 500,
                color: cat.text,
                background: cat.bg,
              }}
            >
              {catalyst.category}
            </span>
            <span style={{ fontSize: "0.68rem", display: "flex", alignItems: "center", gap: 4, color: statusColor }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
              {STATUS_LABELS[catalyst.status] || catalyst.status}
            </span>
            {recentlyUpdated && (
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--accent-cyan)",
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  padding: "2px 7px",
                  borderRadius: 10,
                  letterSpacing: "0.03em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  animation: "badgeFade 3s ease-in-out infinite",
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent-cyan)" }} />
                Updated {timeAgo(catalyst.updated_at)}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--text-primary)",
              whiteSpace: expanded ? "normal" : "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {catalyst.title}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "0.63rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "2px 8px",
              borderRadius: 3,
              whiteSpace: "nowrap",
              color: impactStyle.color,
              background: impactStyle.bg,
            }}
          >
            {IMPACT_LABELS[catalyst.impact] || catalyst.impact}
          </span>
          <span style={{ color: expanded ? "var(--accent-cyan)" : "var(--text-muted)", transition: "color 0.2s" }}>
            <ChevronIcon expanded={expanded} />
          </span>
        </div>
      </div>

      {/* ─── Expanded Content ─── */}
      <div
        style={{
          maxHeight: expanded ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease, opacity 0.25s ease",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div style={{ padding: "0 1.5rem 1.25rem", paddingLeft: "calc(1.5rem + 28px + 0.75rem)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: "0.75rem" }}>
            {catalyst.description}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <CalendarIcon /> {catalyst.date_label}
            </span>
            {catalyst.source_url && (
              <a
                href={catalyst.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "0.7rem",
                  color: "var(--accent-cyan)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: 0.8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
              >
                {catalyst.source_label || "Source"} <ExternalIcon />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
