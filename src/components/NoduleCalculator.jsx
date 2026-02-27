import React, { useState, useMemo } from "react";

/**
 * Obsidian-Style Nodule Calculator with Full Logic Transparency
 * Updated: Feb 26, 2026
 */

const SHARES_OUTSTANDING = 413_000_000; //
const NORI_D_NPV_BASE = 5_500_000_000; //
const FULL_PROJECT_NPV_BASE = 23_600_000_000; //

const METALS = [
  { id: "nickel", name: "Nickel", symbol: "Ni", defaultPrice: 16500, min: 5000, max: 40000, color: "#0A84FF", weight: 0.30 },
  { id: "manganese", name: "Manganese", symbol: "Mn", defaultPrice: 2200, min: 500, max: 5000, color: "#BF5AF2", weight: 0.50 },
  { id: "copper", name: "Copper", symbol: "Cu", defaultPrice: 9500, min: 3000, max: 20000, color: "#FF9F0A", weight: 0.15 },
  { id: "cobalt", name: "Cobalt", symbol: "Co", defaultPrice: 30000, min: 10000, max: 80000, color: "#64D2FF", weight: 0.05 },
];

const BASE_PRICES = { nickel: 18000, manganese: 2500, copper: 9000, cobalt: 35000 };

export default function TransparentObsidianCalculator() {
  const [prices, setPrices] = useState(Object.fromEntries(METALS.map(m => [m.id, m.defaultPrice])));
  const [valuationScope, setValuationScope] = useState("nori-d");
  const [riskAdjustment, setRiskAdjustment] = useState(100);

  const calc = useMemo(() => {
    const baseNPV = valuationScope === "nori-d" ? NORI_D_NPV_BASE : FULL_PROJECT_NPV_BASE;
    let priceImpact = 0;
    METALS.forEach(m => {
      priceImpact += (prices[m.id] / BASE_PRICES[m.id]) * m.weight;
    });

    const finalNPV = baseNPV * priceImpact * (riskAdjustment / 100);
    const perShare = finalNPV / SHARES_OUTSTANDING;

    return { finalNPV, perShare, priceImpact, baseNPV };
  }, [prices, valuationScope, riskAdjustment]);

  return (
    <div style={{ backgroundColor: "#000", color: "#fff", padding: "40px", borderRadius: "28px", maxWidth: "950px", margin: "0 auto", border: "1px solid #1c1c1e" }}>
      
      {/* 1. HERO METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
        <div style={{ backgroundColor: "#1c1c1e", padding: "30px", borderRadius: "20px", border: "1px solid #2c2c2e" }}>
          <div style={{ fontSize: "12px", color: "#86868b", textTransform: "uppercase", letterSpacing: "1px" }}>Adjusted NPV</div>
          <div style={{ fontSize: "42px", fontWeight: "700", marginTop: "10px" }}>${(calc.finalNPV / 1e9).toFixed(2)}B</div>
        </div>
        <div style={{ backgroundColor: "#1c1c1e", padding: "30px", borderRadius: "20px", border: "1px solid #2c2c2e" }}>
          <div style={{ fontSize: "12px", color: "#86868b", textTransform: "uppercase", letterSpacing: "1px" }}>Fair Value / Share</div>
          <div style={{ fontSize: "42px", fontWeight: "700", marginTop: "10px", color: "#32D74B" }}>${calc.perShare.toFixed(2)}</div>
        </div>
      </div>

      {/* 2. CALCULATION LOGIC EXPOSURE (THE NEW SECTION) */}
      <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1c1c1e", borderRadius: "18px", padding: "24px", marginBottom: "40px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#f5f5f7" }}>Model Integrity & Inputs</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
          <div style={{ borderLeft: "2px solid #3a3a3c", paddingLeft: "12px" }}>
            <div style={{ fontSize: "10px", color: "#636366", textTransform: "uppercase" }}>Base NPV</div>
            <div style={{ fontSize: "14px", fontWeight: "500" }}>${(calc.baseNPV / 1e9).toFixed(1)}B</div>
          </div>
          <div style={{ borderLeft: "2px solid #3a3a3c", paddingLeft: "12px" }}>
            <div style={{ fontSize: "10px", color: "#636366", textTransform: "uppercase" }}>Price Mult.</div>
            <div style={{ fontSize: "14px", fontWeight: "500" }}>{calc.priceImpact.toFixed(2)}x</div>
          </div>
          <div style={{ borderLeft: "2px solid #3a3a3c", paddingLeft: "12px" }}>
            <div style={{ fontSize: "10px", color: "#636366", textTransform: "uppercase" }}>Shares</div>
            <div style={{ fontSize: "14px", fontWeight: "500" }}>413.0M</div>
          </div>
          <div style={{ borderLeft: "2px solid #3a3a3c", paddingLeft: "12px" }}>
            <div style={{ fontSize: "10px", color: "#636366", textTransform: "uppercase" }}>Risk Factor</div>
            <div style={{ fontSize: "14px", fontWeight: "500" }}>{riskAdjustment}%</div>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        <div>
          <h4 style={{ fontSize: "14px", color: "#86868b", marginBottom: "20px" }}>Risk & Scope</h4>
          <div style={{ marginBottom: "20px" }}>
             <button onClick={() => setValuationScope("nori-d")} style={{ width: "100%", padding: "10px", backgroundColor: valuationScope === "nori-d" ? "#3a3a3c" : "transparent", border: "1px solid #2c2c2e", borderRadius: "8px", color: "#fff", cursor: "pointer", marginBottom: "10px" }}>NORI-D Only ($5.5B)</button>
             <button onClick={() => setValuationScope("full")} style={{ width: "100%", padding: "10px", backgroundColor: valuationScope === "full" ? "#3a3a3c" : "transparent", border: "1px solid #2c2c2e", borderRadius: "8px", color: "#fff", cursor: "pointer" }}>Full Portfolio ($23.6B)</button>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}><span>Permit Probability</span><span>{riskAdjustment}%</span></div>
            <input type="range" min="10" max="100" value={riskAdjustment} onChange={e => setRiskAdjustment(e.target.value)} style={{ width: "100%", height: "4px", appearance: "none", backgroundColor: "#3a3a3c", borderRadius: "2px" }} />
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "#86868b", marginBottom: "20px" }}>Metal Spot Prices</h4>
          {METALS.map(m => (
            <div key={m.id} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}><span>{m.name}</span><span style={{ color: m.color }}>${prices[m.id].toLocaleString()}</span></div>
              <input type="range" min={m.min} max={m.max} value={prices[m.id]} onChange={e => setPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))} style={{ width: "100%", height: "4px", appearance: "none", backgroundColor: "#3a3a3c", borderRadius: "2px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}