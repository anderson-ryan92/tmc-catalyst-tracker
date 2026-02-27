import { formatScanDate } from "../lib/utils";
import { navigate } from "../lib/router";

const NAV_ITEMS = [
  { id: "", label: "Dashboard" },
  { id: "calculator", label: "Nodule Calculator" },
];

export default function Header({ config, isDemo, showSetup, onToggleSetup, currentPage }) {
  return (
    <header
      className="header"
      style={{
        padding: "1.5rem 3rem 0",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* Top row: logo + meta */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            onClick={() => navigate("")}
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
              cursor: "pointer",
            }}
          >
            T
          </div>
          <div>
            <h1
              onClick={() => navigate("")}
              style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.01em", cursor: "pointer" }}
            >
              TMC Catalyst Tracker
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Built by Ryan Anderson</span>
              <a href="https://www.linkedin.com/in/ryan-anderson92/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent-cyan)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://x.com/anderson_ryan92" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent-cyan)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
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
      </div>

      {/* ─── Navigation Bar ─── */}
      <nav style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid var(--border)",
        marginBottom: "0.5rem",
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                fontSize: "0.78rem",
                fontFamily: "'DM Sans', sans-serif",
                color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                padding: "0.6rem 1.25rem",
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "all 0.2s",
                marginBottom: -1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
