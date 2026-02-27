/**
 * Lightweight Supabase REST client.
 * No SDK dependency — uses the PostgREST API directly.
 */

const ENV_URL = import.meta.env.VITE_SUPABASE_URL;
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function createSupabaseClient(url, key) {
  const baseUrl = url || ENV_URL;
  const apiKey = key || ENV_KEY;

  if (!baseUrl || !apiKey) return null;

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  async function query(table, params = "") {
    const resp = await fetch(`${baseUrl}/rest/v1/${table}?${params}`, { headers });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Supabase ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  return { query };
}

/**
 * Fetch all data needed for the dashboard in parallel.
 */
export async function fetchAllData(client) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [config, catalysts, milestones, news, market] = await Promise.all([
    client.query("site_config", "select=*&id=eq.1"),
    client.query("catalysts", "select=*&is_visible=eq.true&status=neq.completed&status=neq.cancelled&order=rank.asc"),
    client.query("permit_milestones", "select=*&order=sort_order.asc"),
    client.query("news_items", `select=*&is_visible=eq.true&published_at=gte.${sevenDaysAgo}&order=published_at.desc&limit=10`),
    client.query("market_latest", "select=*"),
  ]);

  return {
    config: config[0] || null,
    catalysts,
    milestones,
    news,
    market: market[0] || null,
  };
}
