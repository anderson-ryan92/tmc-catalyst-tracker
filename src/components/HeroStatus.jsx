export default function HeroStatus({ config, catalystCount }) {
  if (!config) return null;

  const metrics = [
    { value: `~${config.days_to_decision || "—"}`, label: "Days to Est.\nDecision", color: "#fbbf24" },
    { value: catalystCount || 0, label: "Active\nCatalysts", color: "#e8ecf4" },
  ];

  return (
    <section className="hero-section" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 3rem 2.5rem" }}>
      <div
        className="status-banner"
        style={{
          background: "linear-gradient(135deg, rgba(56,189,248,0.06), rgba(45,212,191,0.04))",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "2rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top gradient line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, #38bdf8, #2dd4bf, transparent)",
            opacity: 0.4,
          }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            NOAA Permit Status
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "2rem", color: "#fbbf24", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 12px rgba(251,191,36,0.4)" }} />
            {config.permit_status_label}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.4rem", lineHeight: 1.5 }}>
            {config.permit_status_detail}
          </div>
        </div>

        <div className="key-metrics" style={{ display: "flex", gap: "2.5rem" }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.8rem", color: m.color }}>{m.value}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4, whiteSpace: "pre-line" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
