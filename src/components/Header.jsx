import { formatScanDate } from "../lib/utils";

export default function Header({ config, isDemo, showSetup, onToggleSetup }) {
  return (
    <header
      className="header"
      style={{
        padding: "2.5rem 3rem 2rem",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-teal))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.3rem",
            color: "var(--bg-primary)",
            boxShadow: "0 0 24px var(--glow-cyan)",
          }}
        >
          T
        </div>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.01em" }}>
            TMC Catalyst Tracker
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
            The Metals Company · $TMC
          </p>
        </div>
      </div>

      <div className="header-meta" style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isDemo && (
            <button
              onClick={onToggleSetup}
              style={{
                fontSize: "0.68rem",
                color: "var(--accent-cyan)",
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.2)",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {showSetup ? "Close" : "Connect Supabase"}
            </button>
          )}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.72rem",
              color: "var(--accent-emerald)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-emerald)", animation: "pulse 2s ease-in-out infinite" }} />
            {isDemo ? "Demo Mode" : "Live"}
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Last scanned <span style={{ color: "var(--text-secondary)" }}>{config ? formatScanDate(config.last_scan_at) : "—"}</span>
        </div>
      </div>
    </header>
  );
}
