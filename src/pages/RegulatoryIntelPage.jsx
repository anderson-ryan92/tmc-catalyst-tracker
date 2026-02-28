import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const SOURCE_META = {
  noaa_dsm: { icon: "🏛️", color: "#38bdf8", label: "NOAA DSM" },
  regulations_gov: { icon: "📋", color: "#2dd4bf", label: "DSHMRA Docket" },
  hr_4018: { icon: "🏠", color: "#a78bfa", label: "HR 4018" },
  s_2860: { icon: "🏛️", color: "#fbbf24", label: "S.2860" },
  sec_filings: { icon: "📄", color: "#f87171", label: "SEC Filings" },
};

const STATUS_STYLE = {
  changed: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", text: "#fbbf24", label: "Changed" },
  initial: { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)", text: "#38bdf8", label: "Initial Scan" },
  no_change: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", text: "#34d399", label: "No Change" },
  error: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171", label: "Error" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function RegulatoryIntelPage() {
  const [sources, setSources] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'changed', or source_id

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) { setLoading(false); return; }

    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    Promise.all([
      fetch(`${url}/rest/v1/regulatory_sources?select=*&is_active=eq.true&order=source_id`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/regulatory_updates?select=*&order=detected_at.desc&limit=50`, { headers }).then(r => r.json()),
    ])
      .then(([src, upd]) => {
        setSources(src || []);
        setUpdates(upd || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredUpdates = updates.filter((u) => {
    if (filter === "all") return true;
    if (filter === "changed") return u.status === "changed";
    return u.source_id === filter;
  });

  return (
    <>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem 3rem 4rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", fontWeight: 400, marginBottom: "0.5rem" }}>
            Regulatory Intelligence
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 720 }}>
            Automated daily monitoring of NOAA's deep-seabed mining page, the DSHMRA docket on Regulations.gov,
            and key congressional bills. Changes are detected via content hashing and summarized by AI.
          </p>
        </div>

        {/* ─── Source Status Cards ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {sources.map((src) => {
            const meta = SOURCE_META[src.source_id] || { icon: "📄", color: "#94a3b8", label: src.source_id };
            return (
              <div
                key={src.source_id}
                onClick={() => setFilter(filter === src.source_id ? "all" : src.source_id)}
                style={{
                  background: filter === src.source_id ? `${meta.color}11` : "var(--bg-card)",
                  border: `1px solid ${filter === src.source_id ? meta.color + "44" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "1.1rem" }}>{meta.icon}</span>
                  <span style={{
                    fontSize: "0.55rem",
                    color: src.last_changed ? "#fbbf24" : "var(--text-muted)",
                    background: src.last_changed ? "rgba(251,191,36,0.1)" : "rgba(148,163,184,0.1)",
                    padding: "2px 6px",
                    borderRadius: 8,
                    letterSpacing: "0.04em",
                  }}>
                    {src.last_changed ? `Last change: ${timeAgo(src.last_changed)}` : "No changes yet"}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500, marginBottom: 4 }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  Checked {src.check_count || 0} times
                  {src.last_checked && ` · Last: ${timeAgo(src.last_checked)}`}
                </div>
              </div>
            );
          })}
          {sources.length === 0 && !loading && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No sources configured. Run the regulatory monitor agent to initialize.
            </div>
          )}
        </div>

        {/* ─── Filter Tabs ─── */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {[
            { id: "all", label: "All Updates" },
            { id: "changed", label: "Changes Only" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                fontSize: "0.68rem",
                padding: "5px 12px",
                borderRadius: 12,
                border: `1px solid ${filter === f.id ? "var(--accent-cyan)" : "var(--border)"}`,
                background: filter === f.id ? "rgba(56,189,248,0.08)" : "transparent",
                color: filter === f.id ? "var(--accent-cyan)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ─── Update Feed ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading regulatory updates...
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {filter === "changed"
                ? "No changes detected yet. The monitor checks daily."
                : "No updates yet. Run the regulatory monitor to start tracking."}
            </div>
          ) : (
            filteredUpdates.map((u) => {
              const meta = SOURCE_META[u.source_id] || { icon: "📄", color: "#94a3b8", label: u.source_id };
              const statusStyle = STATUS_STYLE[u.status] || STATUS_STYLE.no_change;

              return (
                <div
                  key={u.id}
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${u.status === "changed" ? statusStyle.border : "var(--border)"}`,
                    borderLeft: `3px solid ${u.status === "changed" ? "#fbbf24" : meta.color}`,
                    borderRadius: 10,
                    padding: "1rem 1.25rem",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{meta.icon}</span>
                      <span style={{ fontSize: "0.72rem", color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                      <span style={{
                        fontSize: "0.55rem",
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                      {formatDate(u.detected_at)}
                    </span>
                  </div>

                  {/* Summary */}
                  {u.summary && (
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 8 }}>
                      {u.summary}
                    </div>
                  )}

                  {/* Source link */}
                  <a
                    href={u.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.65rem", color: "var(--accent-cyan)", textDecoration: "none", opacity: 0.7 }}
                  >
                    View source →
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
