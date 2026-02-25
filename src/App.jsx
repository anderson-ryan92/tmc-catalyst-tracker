import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient, fetchAllData } from "./lib/supabase";
import { DEMO_CONFIG, DEMO_CATALYSTS, DEMO_MILESTONES, DEMO_NEWS, DEMO_MARKET } from "./data/demo";
import Header from "./components/Header";
import SetupPanel from "./components/SetupPanel";
import HeroStatus from "./components/HeroStatus";
import CatalystCard from "./components/CatalystCard";
import MarketSnapshot from "./components/MarketSnapshot";
import PermitTimeline from "./components/PermitTimeline";
import NewsFeed from "./components/NewsFeed";
import Footer from "./components/Footer";

export default function App() {
  const [config, setConfig] = useState(null);
  const [catalysts, setCatalysts] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [news, setNews] = useState([]);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showSetup, setShowSetup] = useState(false);

  // Load demo data on mount, or connect to Supabase if env vars are set
  const loadDemoData = useCallback(() => {
    setConfig(DEMO_CONFIG);
    setCatalysts(DEMO_CATALYSTS);
    setMilestones(DEMO_MILESTONES);
    setNews(DEMO_NEWS);
    setMarket(DEMO_MARKET);
    setIsDemo(true);
    setLoading(false);
  }, []);

  const connectSupabase = useCallback(async (url, key) => {
    setError(null);
    try {
      const client = createSupabaseClient(url, key);
      if (!client) throw new Error("Invalid URL or key");

      const data = await fetchAllData(client);
      setConfig(data.config || DEMO_CONFIG);
      setCatalysts(data.catalysts.length ? data.catalysts : DEMO_CATALYSTS);
      setMilestones(data.milestones.length ? data.milestones : DEMO_MILESTONES);
      setNews(data.news.length ? data.news : DEMO_NEWS);
      setMarket(data.market || DEMO_MARKET);
      setIsDemo(false);
      setShowSetup(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try env vars first
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (envUrl && envKey) {
      connectSupabase(envUrl, envKey);
    } else {
      loadDemoData();
    }
  }, [connectSupabase, loadDemoData]);

  const filteredCatalysts = filter === "all" ? catalysts : catalysts.filter((c) => c.category === filter);
  const filters = ["all", "regulatory", "corporate", "market", "policy"];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-cyan)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "2px solid rgba(56,189,248,0.2)", borderTopColor: "var(--accent-cyan)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background depth effect */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(56,189,248,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(45,212,191,0.03) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Header config={config} isDemo={isDemo} showSetup={showSetup} onToggleSetup={() => setShowSetup(!showSetup)} />

        {showSetup && <SetupPanel onConnect={connectSupabase} error={error} />}

        <HeroStatus config={config} />

        {/* ─── Main Grid ─── */}
        <main className="main-grid" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 3rem 4rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "2.5rem" }}>
          {/* Catalysts column */}
          <section>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.25rem", fontWeight: 400, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              Active Catalysts
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", color: "var(--text-muted)", background: "rgba(56,189,248,0.08)", padding: "3px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>
                {catalysts.length} EVENTS
              </span>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: filter === f ? "rgba(56,189,248,0.06)" : "transparent",
                    border: `1px solid ${filter === f ? "var(--accent-cyan)" : "var(--border)"}`,
                    color: filter === f ? "var(--accent-cyan)" : "var(--text-muted)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    padding: "6px 14px",
                    borderRadius: 20,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    letterSpacing: "0.02em",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredCatalysts.map((c, i) => (
                <CatalystCard key={c.id} catalyst={c} animDelay={0.1 + i * 0.08} />
              ))}
              {filteredCatalysts.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No catalysts in this category.
                </div>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <MarketSnapshot market={market} />
            <PermitTimeline milestones={milestones} />
            <NewsFeed news={news} />
          </aside>
        </main>

        <Footer />
      </div>
    </div>
  );
}
