import { useState, useMemo } from "react";

const PHASES = [
  {
    id: "application",
    label: "Application Filed",
    startDate: "2026-01-22T12:00:00",
    endDate: "2026-01-22T12:00:00",
    status: "completed",
    detail: "TMC USA filed a first-of-its-kind consolidated 65,000 km² commercial recovery application under NOAA's updated DSHMRA regulations.",
    source: "https://investors.metals.co/news-events/press-releases",
  },
  {
    id: "public_comment_1",
    label: "Initial Public Comment",
    startDate: "2026-01-22T12:00:00",
    endDate: "2026-02-23T12:00:00",
    status: "completed",
    detail: "NOAA held two virtual public hearings (Jan 27–28) and accepted written comments through Feb 23, 2026. Over 900 comments were received.",
    source: "https://oceanservice.noaa.gov/deep-seabed-mining/",
  },
  {
    id: "certification",
    label: "Certification Review",
    startDate: "2026-02-23T12:00:00",
    endDate: "2026-05-01T12:00:00",
    status: "in_progress",
    detail: "NOAA is conducting its 100-day certification review to verify the consolidated application meets all statutory requirements under DSHMRA. Certification officially starts the formal permitting clock.",
    source: "https://oceanservice.noaa.gov/deep-seabed-mining/",
  },
  {
    id: "draft_eis",
    label: "Draft EIS",
    startDate: "2026-05-01T12:00:00",
    endDate: "2026-05-15T12:00:00",
    status: "upcoming",
    detail: "Publication of the Draft Environmental Impact Statement. This is the massive re-rating event — confirms the government's environmental math. A \"FONSI\" (Finding of No Significant Impact) would effectively drop regulatory risk to zero.",
    source: "https://oceanservice.noaa.gov/deep-seabed-mining/",
  },
  {
    id: "public_comment_2",
    label: "60-Day Public Comment",
    startDate: "2026-05-15T12:00:00",
    endDate: "2026-07-15T12:00:00",
    status: "upcoming",
    detail: "Mandatory 60-day window for public and NGO opposition following the Draft EIS. Expect negative headlines and activist noise. Historically, algorithmic dips during comment periods create buying opportunities.",
    source: "https://oceanservice.noaa.gov/deep-seabed-mining/",
  },
  {
    id: "rod",
    label: "Record of Decision",
    startDate: "2026-07-15T12:00:00",
    endDate: "2026-08-21T12:00:00",
    status: "upcoming",
    detail: "The finish line. NOAA issues a Record of Decision granting or denying the commercial recovery permit. Approval transitions TMC to a fully permitted, commercial U.S. asset.",
    source: "https://oceanservice.noaa.gov/deep-seabed-mining/",
  },
];

const TIMELINE_START = new Date("2026-01-15T12:00:00");
const TIMELINE_END = new Date("2026-09-15T12:00:00");
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

function dateToPercent(dateStr) {
  const d = new Date(dateStr);
  return Math.max(0, Math.min(100, ((d - TIMELINE_START) / TIMELINE_SPAN) * 100));
}

function formatMonthDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_STYLES = {
  completed: {
    bar: "linear-gradient(90deg, #34d399, #2dd4bf)",
    text: "#0a0e17",
    textSecondary: "rgba(10,14,23,0.7)",
    border: "none",
    labelColor: "#34d399",
  },
  in_progress: {
    bar: "linear-gradient(90deg, #38bdf8, #0ea5e9)",
    text: "#0a0e17",
    textSecondary: "rgba(10,14,23,0.7)",
    border: "none",
    labelColor: "#38bdf8",
  },
  upcoming: {
    bar: "linear-gradient(90deg, rgba(167,139,250,0.25), rgba(139,92,246,0.18))",
    text: "#c4b5fd",
    textSecondary: "rgba(196,181,253,0.6)",
    border: "1px solid rgba(167,139,250,0.2)",
    labelColor: "#a78bfa",
  },
};

function getMonthMarkers() {
  const markers = [];
  const start = new Date(TIMELINE_START);
  start.setDate(1);
  start.setMonth(start.getMonth() + 1);
  while (start < TIMELINE_END) {
    const pct = ((start - TIMELINE_START) / TIMELINE_SPAN) * 100;
    if (pct > 2 && pct < 98) {
      markers.push({ label: start.toLocaleDateString("en-US", { month: "short" }), pct });
    }
    start.setMonth(start.getMonth() + 1);
  }
  return markers;
}

export default function PermitProgress({ catalystCount = 0 }) {
  const [expandedPhase, setExpandedPhase] = useState(null);
  
  // Use today's date safely bounded
  const today = useMemo(() => new Date(), []);
  const todayPct = useMemo(() => dateToPercent(today.toISOString()), [today]);
  const monthMarkers = useMemo(() => getMonthMarkers(), []);
  
  // Dynamically calculate days remaining until the Record of Decision
  const daysRemaining = useMemo(() => {
    const finalPhase = PHASES.find(p => p.id === "rod");
    const targetDate = new Date(finalPhase.endDate);
    const diffTime = targetDate - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [today]);

  const todayLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const progressPct = Math.round(((today - TIMELINE_START) / TIMELINE_SPAN) * 100);

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 3rem 2.5rem" }}>
      <style>
        {`
          .gantt-bar {
            transition: transform 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease;
          }
          .gantt-bar:hover {
            transform: scaleY(1.08);
            filter: brightness(1.15);
            z-index: 10;
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseBorder {
            0% { box-shadow: 0 0 0 0 rgba(56,189,248,0.4); }
            70% { box-shadow: 0 0 0 6px rgba(56,189,248,0); }
            100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); }
          }
        `}
      </style>
      <div
        style={{
          background: "linear-gradient(135deg, rgba(56,189,248,0.04), rgba(45,212,191,0.03))",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "2rem 2.5rem 1.5rem",
          position: "relative",
          overflow: "visible",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #38bdf8, #2dd4bf, transparent)", opacity: 0.4 }} />

        {/* ─── Header ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
              NOAA Permit Progress
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
              <span style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "3.2rem",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                background: daysRemaining > 120
                  ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                  : daysRemaining > 60
                    ? "linear-gradient(135deg, #fb923c, #f97316)"
                    : "linear-gradient(135deg, #f87171, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}>
                {daysRemaining}
              </span>
              <span style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "1.3rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Days Until Est. Decision
              </span>
            </div>
            <div style={{ marginTop: 10, width: 280, height: 4, background: "rgba(56,189,248,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, Math.min(progressPct, 100))}%`, height: "100%", background: "linear-gradient(90deg, #34d399, #38bdf8)", borderRadius: 2, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 4 }}>
              {Math.max(0, Math.min(progressPct, 100))}% through estimated timeline
            </div>
          </div>

          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.6rem", color: "var(--text-primary)" }}>{catalystCount}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Active<br/>Catalysts</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.6rem", color: "var(--accent-emerald)" }}>
                {PHASES.filter(p => p.status === "completed").length}/{PHASES.length}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Phases<br/>Complete</div>
            </div>
          </div>
        </div>

        {/* ─── Gantt ─── */}
        <div style={{ position: "relative", marginBottom: "0.5rem" }}>
          <div style={{ position: "relative", height: 20, marginBottom: 8 }}>
            {monthMarkers.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: `${m.pct}%`, transform: "translateX(-50%)", fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {m.label}
              </div>
            ))}
          </div>

          <div style={{ position: "absolute", top: 20, bottom: 0, left: 0, right: 0, pointerEvents: "none" }}>
            {monthMarkers.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: `${m.pct}%`, top: 0, bottom: 0, width: 1, background: "rgba(56,189,248,0.05)" }} />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
            {PHASES.map((phase) => {
              const left = dateToPercent(phase.startDate);
              const right = dateToPercent(phase.endDate);
              const width = Math.max(right - left, 2.5);
              const style = STATUS_STYLES[phase.status];
              const isActive = phase.status === "in_progress";
              const isExpanded = expandedPhase === phase.id;

              return (
                <div key={phase.id} style={{ position: "relative" }}>
                  <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: 28, background: "rgba(56,189,248,0.015)", borderRadius: 6 }} />

                    <div
                      className="gantt-bar"
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${width}%`,
                        height: 28,
                        background: style.bar,
                        border: style.border,
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: width > 8 ? "center" : "flex-start",
                        padding: "0 8px",
                        overflow: "hidden",
                        boxShadow: isActive
                          ? "0 0 16px rgba(56,189,248,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                          : phase.status === "completed"
                            ? "0 0 8px rgba(52,211,153,0.15)"
                            : "0 0 8px rgba(167,139,250,0.08)"
                      }}
                    >
                      {isActive && (
                        <div style={{ position: "absolute", inset: 0, borderRadius: 6, border: "1px solid rgba(56,189,248,0.4)", animation: "pulseBorder 2.5s infinite" }} />
                      )}

                      <span style={{
                        fontSize: width > 12 ? "0.65rem" : "0.58rem",
                        fontWeight: 600,
                        color: style.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 1,
                        letterSpacing: "0.02em",
                      }}>
                        {phase.label}
                      </span>

                      {width > 18 && (
                        <span style={{ fontSize: "0.52rem", color: style.textSecondary, marginLeft: 8, whiteSpace: "nowrap", zIndex: 1 }}>
                          {formatMonthDay(phase.startDate)} — {formatMonthDay(phase.endDate)}
                        </span>
                      )}
                    </div>

                    {phase.status === "completed" && (
                      <div style={{ position: "absolute", left: `${left + width + 0.8}%`, fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 700 }}>✓</div>
                    )}
                  </div>

                  {isExpanded && (
                    <div style={{
                      margin: "4px 0 8px",
                      position: "relative",
                      left: `${Math.min(left, 60)}%`,
                      transform: left > 60 ? "translateX(-40%)" : "none",
                      width: "100%",
                      maxWidth: 420,
                      background: "var(--bg-card)",
                      border: `1px solid ${style.labelColor}33`,
                      borderLeft: `3px solid ${style.labelColor}`,
                      borderRadius: 8,
                      padding: "1rem 1.25rem",
                      animation: "fadeSlideIn 0.25s ease forwards",
                      boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${style.labelColor}11`,
                      zIndex: 20,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: style.labelColor }}>{phase.label}</span>
                        <span style={{
                          fontSize: "0.58rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: `${style.labelColor}15`,
                          color: style.labelColor,
                          border: `1px solid ${style.labelColor}30`,
                        }}>
                          {phase.status === "in_progress" ? "In Progress" : phase.status === "completed" ? "Completed" : "Upcoming"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 8 }}>
                        {formatMonthDay(phase.startDate)} — {formatMonthDay(phase.endDate)}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                        {phase.detail}
                      </div>
                      {phase.source && (
                        <a
                          href={phase.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", color: "var(--accent-cyan)", textDecoration: "none", marginTop: 10, opacity: 0.8 }}
                        >
                          Source →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ position: "absolute", left: `${todayPct}%`, top: 12, bottom: -8, zIndex: 5, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: 0, top: 8, bottom: 0, width: 2, background: "linear-gradient(180deg, #f87171, rgba(248,113,113,0.15))", borderRadius: 1 }} />
            <div style={{
              position: "absolute",
              top: -2,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#f87171",
              color: "#fff",
              fontSize: "0.55rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 10,
              whiteSpace: "nowrap",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              boxShadow: "0 0 8px rgba(248,113,113,0.4)",
            }}>
              Today: {todayLabel}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
          {[
            { label: "Completed", color: "#34d399" },
            { label: "In Progress", color: "#38bdf8" },
            { label: "Upcoming", color: "#a78bfa" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 16, height: 6, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>{item.label}</span>
            </div>
          ))}
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "auto" }}>
            Click any phase for details
          </div>
        </div>
      </div>
    </section>
  );
}