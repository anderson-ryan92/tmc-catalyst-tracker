export default function MarketSnapshot({ market }) {
  if (!market) return null;

  const stats = [
    {
      value: `$${market.price?.toFixed(2) || "—"}`,
      label: "Price",
      change: market.price_change_pct != null
        ? `${market.price_change_pct > 0 ? "▲" : "▼"} ${Math.abs(market.price_change_pct).toFixed(1)}% today`
        : null,
      up: market.price_change_pct > 0,
    },
    {
      value: market.avg_volume_30d ? `${(market.avg_volume_30d / 1e6).toFixed(1)}M` : "—",
      label: "Avg Volume",
      change: market.volume > market.avg_volume_30d ? "▲ vs 30d avg" : "▼ vs 30d avg",
      up: market.volume > market.avg_volume_30d,
    },
    {
      value: market.short_interest_pct != null ? `${market.short_interest_pct.toFixed(1)}%` : "—",
      label: "Short Interest",
      change: "▼ declining",
      up: false,
    },
    {
      value: market.inst_ownership_pct != null ? `${market.inst_ownership_pct.toFixed(1)}%` : "—",
      label: "Inst. Ownership",
      change: "▲ increasing",
      up: true,
    },
  ];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.05rem", fontWeight: 400, marginBottom: "1.25rem" }}>
        Market Snapshot
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: "0.75rem", background: "rgba(56,189,248,0.03)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.35rem" }}>{s.value}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
              {s.label}
            </div>
            {s.change && (
              <div style={{ fontSize: "0.68rem", marginTop: 4, color: s.up ? "var(--accent-emerald)" : "var(--accent-red)" }}>
                {s.change}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
