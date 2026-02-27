import NoduleCalculator from "../components/NoduleCalculator";
import Footer from "../components/Footer";

export default function CalculatorPage() {
  return (
    <>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem 3rem 4rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", fontWeight: 400, marginBottom: "0.5rem" }}>
            Nodule Resource Calculator
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 720 }}>
            TMC's NORI-D and TOML contract areas contain an estimated 619 million wet tonnes of polymetallic nodules
            rich in nickel, cobalt, manganese, and copper. Adjust metal prices, recovery rates, and operating costs
            below to explore the implied resource valuation under different market scenarios.
          </p>
        </div>

        <NoduleCalculator />
      </div>
      <Footer />
    </>
  );
}
