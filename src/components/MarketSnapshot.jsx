import { useRef, useEffect } from "react";
import useFinnhub from "../lib/useFinnhub";

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export default function MarketSnapshot({ market }) {
  if (!market) return null;

  const { price: livePrice, volume: liveVolume, changePct, connected } = useFinnhub(FINNHUB_KEY);
  const prevPriceRef = useRef(null);
  const flashRef = useRef(null);

  // Determine which values to display (live overrides DB snapshot)
  const displayPrice = livePrice ?? market.price;
  const displayChangePct = changePct ?? market.price_change_pct;
  const displayVolume = liveVolume ?? market.volume;
  const isUp = displayChangePct > 0;

  // Flash effect on price change
  useEffect(() => {
    if (livePrice != null && prevPriceRef.current != null && livePrice !== prevPriceRef.current) {
      const el = flashRef.current;
      if (el) {
        const color = livePrice > prevPriceRef.current
          ? "rgba(52,211,153,0.15)"
          : "rgba(248,113,113,0.15)";
        el.style.background = color;
        setTimeout(() => { el.style.background = "rgba(56,189,248,0.03)"; }, 400);
      }
    }
    prevPriceRef.current = livePrice;
  }, [livePrice]);

  const stats = [
    {
      ref: flashRef,
      value: displayPrice != null ? `$${displayPrice.toFixed(2)}` : "—",
      label: "Price",
      live: connected,
      change: displayChangePct != null
        ? `${isUp ? "▲" : "▼"} ${Math.abs(displayChangePct).toFixed(1)}% today`
        : null,
      up: isUp,
    },
    {
      value: displayVolume
        ? displayVolume >= 1e6
          ? `${(displayVolume / 1e6).toFixed(1)}M`
          : `${(displayVolume / 1e3).toFixed(0)}K`
        : "—",
      label: connected ? "Volume (Live)" : "Avg Volume",
      live: connected,
      change: market.avg_volume_30d && displayVolume
        ? displayVolume > market.avg_volume_30d ? "▲ vs 30d avg" : "▼ vs 30d avg"
        : null,
      up: displayVolume > (market.avg_volume_30d || 0),
    },
    {
      value: market.short_interest_pct != null ? `${market.short_interest_pct.toFixed(1)}%` : "—",
      label: "Short Interest",
      change: null,
      up: false,
    },
    {
      value: market.inst_ownership_pct != null ? `${market.inst_ownership_pct.toFixed(1)}%` : "—",
      label: "Inst. Ownership",
      change: null,
      up: true,
    },
  ];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.05rem", fontWeight: 400 }}>
          Market Snapshot
        </div>
        {connected && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: "0.6rem",
            color: "var(--accent-emerald)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--accent-emerald)",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            Live
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {stats.map((s, i) => (
          <div
            key={i}
            ref={s.ref || null}
            style={{
              padding: "0.75rem",
              background: "rgba(56,189,248,0.03)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              transition: "background 0.4s ease",
            }}
          >
            <div style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "1.35rem",
              color: i === 0 && displayChangePct != null
                ? isUp ? "var(--accent-emerald)" : "var(--accent-red)"
                : "var(--text-primary)",
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginTop: 2,
            }}>
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
