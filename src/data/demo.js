/**
 * Demo data used when Supabase is not connected.
 * Mirrors the exact schema from the database.
 */

export const DEMO_CONFIG = {
  permit_status_label: "Pending Review",
  permit_status_detail:
    "Environmental Impact Statement under review. Public comment period closed Jan 15, 2026. Decision expected Q2 2026.",
  days_to_decision: 84,
  pending_catalysts: 3,
  completed_milestones: 7,
  last_scan_at: new Date(Date.now() - 6 * 3600000).toISOString(),
};

export const DEMO_CATALYSTS = [
  {
    id: "1",
    rank: 1,
    category: "regulatory",
    status: "pending",
    title: "NOAA Environmental Impact Statement Decision",
    description:
      "Final EIS review underway following the close of the public comment period. A positive decision would clear the largest remaining regulatory hurdle for commercial nodule collection in the Clarion-Clipperton Zone. This is the single most important catalyst for TMC — permit approval effectively de-risks the entire investment thesis.",
    impact: "critical",
    date_label: "Expected Q2 2026",
    source_url: "https://www.fisheries.noaa.gov/",
    source_label: "NOAA.gov",
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "2",
    rank: 2,
    category: "regulatory",
    status: "upcoming",
    title: "ISA Council Meeting — 31st Session",
    description:
      "The International Seabed Authority Council convenes to discuss the Mining Code framework. Progress on exploitation regulations would provide a clearer international legal basis for TMC's commercial operations and could accelerate NOAA's decision-making.",
    impact: "high",
    date_label: "Mar 17–28, 2026",
    source_url: "https://www.isa.org.jm/",
    source_label: "ISA.org.jm",
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "3",
    rank: 3,
    category: "policy",
    status: "in_progress",
    title: "U.S. Critical Minerals Executive Order",
    description:
      "Ongoing federal initiatives to secure domestic supply chains for nickel, cobalt, and manganese — all found in polymetallic nodules. Creates strong political tailwind for NOAA permit approval and could unlock federal incentives or offtake agreements.",
    impact: "high",
    date_label: "Ongoing",
    source_url: "https://www.whitehouse.gov/briefing-room/presidential-actions/",
    source_label: "WhiteHouse.gov",
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "4",
    rank: 4,
    category: "corporate",
    status: "upcoming",
    title: "Q4 2025 Earnings Report",
    description:
      "Quarterly results and management commentary. Investors will focus on cash runway, operational readiness updates, and any forward guidance on permit timelines or partnership developments.",
    impact: "medium",
    date_label: "~Mar 2026",
    source_url:
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=TMC&type=10-Q",
    source_label: "SEC EDGAR",
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "5",
    rank: 5,
    category: "market",
    status: "completed",
    title: "NORI-D Collector Test — Successful Completion",
    description:
      "Pilot collection system test in the CCZ demonstrated commercial viability. Over 3,000 tonnes of wet nodules collected during trial, exceeding targets. De-risks the technology and strengthens the permit application.",
    impact: "medium",
    date_label: "Nov 2024",
    source_url: "https://investors.metals.co/news-releases",
    source_label: "TMC Investor Relations",
    updated_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: "6",
    rank: 6,
    category: "corporate",
    status: "completed",
    title: "$25M Capital Raise",
    description:
      "Successful equity offering extending cash runway through key regulatory milestones. Reduces near-term dilution risk and signals institutional confidence.",
    impact: "low",
    date_label: "Jan 2026",
    source_url:
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=TMC&type=S-3",
    source_label: "SEC EDGAR",
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const DEMO_MILESTONES = [
  { sort_order: 1, title: "EIS Application Filed", date_label: "Jun 2024", status: "completed" },
  { sort_order: 2, title: "NOAA Scoping Period", date_label: "Aug – Oct 2024", status: "completed" },
  { sort_order: 3, title: "Draft EIS Published", date_label: "Nov 2025", status: "completed" },
  { sort_order: 4, title: "Public Comment Period", date_label: "Closed Jan 15, 2026", status: "completed" },
  { sort_order: 5, title: "Final EIS Review", date_label: "In progress — est. Q2 2026", status: "current" },
  { sort_order: 6, title: "Record of Decision", date_label: "Permit granted or denied", status: "upcoming" },
];

export const DEMO_NEWS = [
  {
    id: "n1",
    source_name: "Reuters",
    source_url: "https://www.reuters.com/business/environment/",
    headline: "Deep-sea mining firms gain momentum as critical mineral demand surges",
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "n2",
    source_name: "TMC Investor Relations",
    source_url: "https://investors.metals.co/news-releases",
    headline: "The Metals Company provides update on NOAA environmental review process",
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "n3",
    source_name: "Mining.com",
    source_url: "https://www.mining.com/",
    headline: "ISA members signal progress on deep-sea mining regulations ahead of March session",
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "n4",
    source_name: "SEC Filing",
    source_url:
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=TMC&type=10-K",
    headline: "TMC 10-K Annual Report filed — cash position and runway detailed",
    published_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

export const DEMO_MARKET = {
  price: 4.82,
  price_change_pct: 3.2,
  volume: 15600000,
  avg_volume_30d: 12400000,
  short_interest_pct: 18.7,
  inst_ownership_pct: 31.2,
};
