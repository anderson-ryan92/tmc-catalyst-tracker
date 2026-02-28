import { useState, useMemo, useCallback } from "react";

/**
 * NoduleCalculator — Based on TMC's actual Pre-Feasibility Study (Aug 2025)
 * and Initial Assessment economics.
 *
 * PFS: NORI-D — 51Mt probable reserves, 18-yr LOM, NPV $5.508B at 8% discount
 * IA:  Remaining NORI + TOML — 670Mt production, 23-yr LOM, NPV $18.081B at 8% discount
 * Combined: $23.589B
 *
 * Users can adjust metal prices and discount rate to see how NPV changes.
 * At base-case prices and 8% discount, output = TMC's published numbers exactly.
 */

// ─── Single unified base-case price deck (PFS weighted averages) ───
const BASE_PRICES = {
  nickel: 20295,   // $/tonne
  cobalt: 56117,   // $/tonne
  copper: 11440,   // $/tonne
  manganese: 5.45, // $/dmtu
};

// ─── Study economics (from TMC filings) ───
const STUDIES = {
  pfs: {
    label: "NORI-D (PFS)",
    npv: 5.508,          // $B after-tax at 8%
    irr: 26.8,           // %
    mineLife: 18,        // years
    totalRevenue: 69.0,  // $B estimated LOM revenue
    totalOpex: 39.978,   // $B LOM opex
    totalCapex: 4.918,   // $B
    // Revenue weights by metal (from PFS production × base prices)
    // Ni: 97ktpa × $20,295 = $1.97B/yr → ~35%
    // Co: 7.4ktpa × $56,117 = $0.42B/yr → ~7%
    // Cu: 70ktpa × $11,440 = $0.80B/yr → ~14%
    // Mn: 2,389ktpa × 31.15% grade × $5.45/dmtu → ~$2.49B/yr → ~44%
    revenueWeights: { nickel: 0.35, cobalt: 0.07, copper: 0.14, manganese: 0.44 },
  },
  ia: {
    label: "NORI + TOML (IA)",
    npv: 18.081,
    irr: 35.6,
    mineLife: 23,
    totalRevenue: 195.0,  // $B estimated LOM revenue
    totalOpex: 126.175,
    totalCapex: 8.852,
    revenueWeights: { nickel: 0.33, cobalt: 0.10, copper: 0.13, manganese: 0.44 },
  },
};

const SHARES = 413_490_000;
const BASE_DISCOUNT = 8;

const METALS = [
  { id: "nickel", name: "Nickel", symbol: "Ni", color: "#38bdf8", min: 8000, max: 35000, step: 250, unit: "$/t" },
  { id: "cobalt", name: "Cobalt", symbol: "Co", color: "#a78bfa", min: 15000, max: 90000, step: 500, unit: "$/t" },
  { id: "copper", name: "Copper", symbol: "Cu", color: "#f97316", min: 5000, max: 18000, step: 250, unit: "$/t" },
  { id: "manganese", name: "Manganese (Silicate)", symbol: "Mn", color: "#fbbf24", min: 2, max: 10, step: 0.1, unit: "$/dmtu" },
];

const SCENARIOS = {
  bear: { label: "Bear Case", nickel: 14000, cobalt: 25000, copper: 8000, manganese: 3.0, discount: 10 },
  base: { label: "PFS Base Case", nickel: 20295, cobalt: 56117, copper: 11440, manganese: 5.45, discount: 8 },
  bull: { label: "Bull Case", nickel: 28000, cobalt: 70000, copper: 15000, manganese: 8.0, discount: 6 },
};

function formatB(val) {
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(2)}T`;
  if (Math.abs(val) >= 1) return `$${val.toFixed(1)}B`;
  return `$${(val * 1000).toFixed(0)}M`;
}

const sliderStyle = (color) => ({
  width: "100%",
  height: 6,
  appearance: "none",
  WebkitAppearance: "none",
  background: `linear-gradient(90deg, ${color}33, ${color}66)`,
  borderRadius: 3,
  outline: "none",
  cursor: "pointer",
});

export default function NoduleCalculator() {
  const [prices, setPrices] = useState({ ...BASE_PRICES });
  const [discount, setDiscount] = useState(BASE_DISCOUNT);
  const [activeScenario, setActiveScenario] = useState("base");

  const setPrice = useCallback((id, val) => {
    setPrices((p) => ({ ...p, [id]: Number(val) }));
    setActiveScenario("custom");
  }, []);

  const applyScenario = useCallback((key) => {
    const s = SCENARIOS[key];
    setPrices({ nickel: s.nickel, cobalt: s.cobalt, copper: s.copper, manganese: s.manganese });
    setDiscount(s.discount);
    setActiveScenario(key);
  }, []);

  // ─── NPV Sensitivity ───
  // Both studies use the SAME base price deck (BASE_PRICES).
  // At base prices + 8% discount → exact published NPVs.
  const calcStudy = useCallback((study) => {
    // Revenue multiplier: weighted average of (user price / base price)
    let revMultiplier = 0;
    for (const [metalId, weight] of Object.entries(study.revenueWeights)) {
      revMultiplier += weight * (prices[metalId] / BASE_PRICES[metalId]);
    }

    // NPV sensitivity to revenue: ∆NPV = ∆Revenue × (1 / margin)
    // At revMultiplier=1.0, npvDelta=0, so adjustedNpv = study.npv exactly
    const margin = (study.totalRevenue - study.totalOpex) / study.totalRevenue;
    const npvDelta = study.npv * (revMultiplier - 1) / margin;
    const priceAdjustedNpv = study.npv + npvDelta;

    // Discount rate: simple inverse scaling (approximation)
    const discountAdj = BASE_DISCOUNT / discount;
    const adjustedNpv = priceAdjustedNpv * discountAdj;

    // IRR scales roughly with revenue
    const adjustedIrr = study.irr * Math.max(revMultiplier, 0);

    return {
      npv: Math.max(adjustedNpv, 0),
      irr: Math.min(Math.max(adjustedIrr, 0), 99),
      revMultiplier,
    };
  }, [prices, discount]);

  const results = useMemo(() => {
    const pfs = calcStudy(STUDIES.pfs);
    const ia = calcStudy(STUDIES.ia);
    const combinedNpv = pfs.npv + ia.npv;
    const perShare = (combinedNpv * 1e9) / SHARES;
    return { pfs, ia, combinedNpv, perShare };
  }, [calcStudy]);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "1.75rem 2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #fbbf24, #f97316, transparent)", opacity: 0.4 }} />

      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.15rem", fontWeight: 400 }}>
            TMC Valuation Sensitivity Calculator
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 3 }}>
            Based on TMC's Pre-Feasibility Study & Initial Assessment (Aug 2025) · {(SHARES / 1e6).toFixed(0)}M shares
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => applyScenario(key)}
              style={{
                fontSize: "0.62rem",
                padding: "4px 10px",
                borderRadius: 12,
                border: `1px solid ${activeScenario === key ? "var(--accent-cyan)" : "var(--border)"}`,
                background: activeScenario === key ? "rgba(56,189,248,0.08)" : "transparent",
                color: activeScenario === key ? "var(--accent-cyan)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
                transition: "all 0.2s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── NPV Results ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "1rem",
        marginBottom: "1.75rem",
        padding: "1.25rem",
        background: "linear-gradient(135deg, rgba(251,191,36,0.04), rgba(249,115,22,0.03))",
        borderRadius: 10,
        border: "1px solid rgba(251,191,36,0.1)",
      }}>
        <div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            NORI-D NPV
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", color: results.pfs.npv > 0 ? "var(--accent-emerald)" : "var(--accent-red)" }}>
            {formatB(results.pfs.npv)}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: 2 }}>
            IRR: {results.pfs.irr.toFixed(0)}% · 18yr LOM
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            NORI + TOML NPV
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", color: results.ia.npv > 0 ? "var(--accent-emerald)" : "var(--accent-red)" }}>
            {formatB(results.ia.npv)}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: 2 }}>
            IRR: {results.ia.irr.toFixed(0)}% · 23yr LOM
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Combined NPV
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", color: "#fbbf24" }}>
            {formatB(results.combinedNpv)}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: 2 }}>
            At {discount}% discount rate
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            NPV Per Share
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", color: results.perShare > 0 ? "#fbbf24" : "var(--accent-red)" }}>
            ${results.perShare.toFixed(2)}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: 2 }}>
            vs. ~$6 current price
          </div>
        </div>
      </div>

      {/* ─── Revenue Contribution Bar ─── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Revenue Contribution by Metal (PFS Weights)
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }}>
          {METALS.map((m) => (
            <div
              key={m.id}
              style={{
                width: `${(STUDIES.pfs.revenueWeights[m.id] || 0) * 100}%`,
                background: m.color,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: 6 }}>
          {METALS.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
              <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                {m.symbol} {((STUDIES.pfs.revenueWeights[m.id] || 0) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Metal Price Sliders ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        {METALS.map((m) => {
          const basePrice = BASE_PRICES[m.id];
          const userPrice = prices[m.id];
          const pctChange = ((userPrice - basePrice) / basePrice) * 100;

          return (
            <div key={m.id} style={{ padding: "0.75rem", background: "rgba(56,189,248,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: m.color, display: "inline-block" }} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-primary)", fontWeight: 500 }}>{m.name}</span>
                  {Math.abs(pctChange) > 0.5 && (
                    <span style={{ fontSize: "0.55rem", color: pctChange > 0 ? "var(--accent-emerald)" : "var(--accent-red)" }}>
                      {pctChange > 0 ? "▲" : "▼"}{Math.abs(pctChange).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number"
                    value={m.id === "manganese" ? prices[m.id] : Math.round(prices[m.id])}
                    step={m.step}
                    onChange={(e) => setPrice(m.id, e.target.value)}
                    style={{
                      width: 80,
                      fontSize: "0.72rem",
                      fontFamily: "'DM Sans', sans-serif",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      color: m.color,
                      padding: "2px 6px",
                      textAlign: "right",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{m.unit}</span>
                </div>
              </div>
              <input
                type="range"
                min={m.min}
                max={m.max}
                step={m.step}
                value={prices[m.id]}
                onChange={(e) => setPrice(m.id, e.target.value)}
                style={sliderStyle(m.color)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>
                  {m.id === "manganese" ? `$${m.min}/dmtu` : `$${m.min.toLocaleString()}/t`}
                </span>
                <span style={{ fontSize: "0.52rem", color: "var(--text-muted)", opacity: 0.5 }}>
                  PFS: {m.id === "manganese" ? `$${basePrice}/dmtu` : `$${basePrice.toLocaleString()}/t`}
                </span>
                <span style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>
                  {m.id === "manganese" ? `$${m.max}/dmtu` : `$${m.max.toLocaleString()}/t`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Discount Rate ─── */}
      <div style={{ padding: "0.75rem", background: "rgba(56,189,248,0.02)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-primary)", fontWeight: 500 }}>Discount Rate</span>
          <span style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontFamily: "'Instrument Serif', serif" }}>{discount}%</span>
        </div>
        <input
          type="range"
          min={4}
          max={15}
          step={0.5}
          value={discount}
          onChange={(e) => { setDiscount(Number(e.target.value)); setActiveScenario("custom"); }}
          style={sliderStyle("#38bdf8")}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>4%</span>
          <span style={{ fontSize: "0.52rem", color: "var(--text-muted)", opacity: 0.5 }}>PFS: 8%</span>
          <span style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>15%</span>
        </div>
      </div>

      {/* ─── PFS Key Metrics ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.75rem",
        marginBottom: "1rem",
        padding: "1rem",
        background: "rgba(56,189,248,0.02)",
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}>
        {[
          { label: "NORI-D Reserves", value: "51 Mt", sub: "Probable" },
          { label: "Total Resource", value: "1.3 Bt", sub: "All areas" },
          { label: "LOM Capex (PFS)", value: "$4.9B", sub: "$113M ea. initial" },
          { label: "C1 Cash Cost", value: "$1,065/t Ni", sub: "First quartile" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
              {item.label}
            </div>
            <div style={{ fontSize: "0.85rem", fontFamily: "'Instrument Serif', serif", color: "var(--text-primary)" }}>
              {item.value}
            </div>
            <div style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Disclaimer ─── */}
      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", lineHeight: 1.5, opacity: 0.6 }}>
        Based on TMC's SK-1300 Pre-Feasibility Study and Initial Assessment (August 4, 2025).
        NPV sensitivity is approximate — actual NPV depends on production schedules, tax rates, and cost escalation.
        At PFS base-case prices and 8% discount rate, this calculator reproduces TMC's published combined NPV of $23.6B.
        Not financial advice. Read the full{" "}
        <a href="https://investors.metals.co/news-releases/news-release-details/tmc-releases-two-economic-studies-combined-npv-236b-and-declares" target="_blank" rel="noopener" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>
          PFS & IA reports
        </a>.
      </div>
    </div>
  );
}
