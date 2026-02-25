export default function Footer() {
  return (
    <footer
      className="site-footer"
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "2rem 3rem",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", maxWidth: 600, lineHeight: 1.5 }}>
        This site is for informational purposes only and does not constitute financial advice. Data may be delayed or
        inaccurate. Always do your own research before making investment decisions. Not affiliated with The Metals
        Company.
      </div>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {["About", "Sources", "API"].map((label) => (
          <a key={label} href="#" style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "none" }}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
