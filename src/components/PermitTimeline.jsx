export default function PermitTimeline({ milestones }) {
  if (!milestones?.length) return null;

  const dotStyles = {
    completed: { border: "var(--accent-emerald)", bg: "var(--accent-emerald)", shadow: "none" },
    current: { border: "var(--accent-cyan)", bg: "var(--bg-card)", shadow: "0 0 8px var(--glow-cyan)" },
    upcoming: { border: "var(--text-muted)", bg: "var(--bg-card)", shadow: "none" },
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.05rem", fontWeight: 400, marginBottom: "1.25rem" }}>
        Permit Timeline
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {milestones.map((m, i) => {
          const dot = dotStyles[m.status] || dotStyles.upcoming;
          return (
            <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", position: "relative" }}>
              {i < milestones.length - 1 && (
                <div style={{ position: "absolute", left: 5, top: "2rem", bottom: "-0.1rem", width: 1, background: "var(--border)" }} />
              )}
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  border: `2px solid ${dot.border}`,
                  background: dot.bg,
                  flexShrink: 0,
                  marginTop: 3,
                  boxShadow: dot.shadow,
                }}
              />
              <div>
                <h4 style={{ fontSize: "0.82rem", fontWeight: 500, marginBottom: 2 }}>{m.title}</h4>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{m.date_label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
