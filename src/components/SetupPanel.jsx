import { useState } from "react";

export default function SetupPanel({ onConnect, error }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    await onConnect(url, key);
    setConnecting(false);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 3rem 1rem" }}>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(56,189,248,0.15)",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
            Supabase URL
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxx.supabase.co"
            style={{
              width: "100%",
              background: "var(--bg-primary)",
              border: "1px solid rgba(56,189,248,0.12)",
              borderRadius: 6,
              padding: "8px 10px",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
            Anon Key
          </label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="eyJ..."
            type="password"
            style={{
              width: "100%",
              background: "var(--bg-primary)",
              border: "1px solid rgba(56,189,248,0.12)",
              borderRadius: 6,
              padding: "8px 10px",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting || !url || !key}
          style={{
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-teal))",
            color: "var(--bg-primary)",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            opacity: connecting || !url || !key ? 0.5 : 1,
          }}
        >
          {connecting ? "Connecting..." : "Connect"}
        </button>
      </div>
      {error && <div style={{ fontSize: "0.75rem", color: "var(--accent-red)", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
