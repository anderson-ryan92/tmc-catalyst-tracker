import { ExternalIcon } from "./Icons";
import { timeAgo } from "../lib/utils";

export default function NewsFeed({ news }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.05rem", fontWeight: 400, marginBottom: "1.25rem" }}>
        Latest News
      </div>
      {(!news || news.length === 0) ? (
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "1rem 0" }}>
          No news from the past 7 days.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
        {news.map((n, i) => (
          <a
            key={n.id || i}
            href={n.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textDecoration: "none",
              padding: "0.85rem 0",
              borderBottom: i < news.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                fontSize: "0.63rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--accent-cyan)",
                marginBottom: 3,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {n.source_name}
              <ExternalIcon size={9} />
            </div>
            <div
              className="news-headline"
              style={{
                fontSize: "0.8rem",
                color: "var(--text-primary)",
                fontWeight: 400,
                lineHeight: 1.45,
                marginBottom: 3,
                transition: "color 0.2s",
              }}
            >
              {n.headline}
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>{timeAgo(n.published_at)}</div>
          </a>
        ))}
        </div>
      )}
    </div>
  );
}
