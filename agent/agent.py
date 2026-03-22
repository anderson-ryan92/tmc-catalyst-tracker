"""
TMC Catalyst Tracker — Daily Agent
====================================
Scrapes data sources, uses Claude to detect changes,
updates Supabase, and sends Telegram notifications.

Run daily via cron, GitHub Actions, or Cloud Run scheduler.

Usage:
  python agent.py                  # Full run
  python agent.py --dry-run        # Analyze but don't write to DB
  python agent.py --sources-only   # Just scrape and print raw data
  python agent.py --market-only    # Only update market data

Requirements:
  pip install anthropic supabase httpx beautifulsoup4 python-dotenv
"""

import os
import json
import hashlib
import logging
import argparse
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from anthropic import Anthropic
from supabase import create_client, Client

load_dotenv()

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # service_role key (full access)
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

# Market data API (free tier)
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY")
FMP_API_KEY = os.environ.get("FMP_API_KEY")  # financialmodelingprep.com

CLAUDE_MODEL = "claude-sonnet-4-5-20250929"
TMC_TICKER = "TMC"

# Sources to scrape
SOURCES = {
    "tmc_ir": {
        "url": "https://investors.metals.co/news-events/press-releases",
        "label": "TMC Investor Relations",
        "category": "corporate",
    },
    "noaa_eis": {
        "url": "https://oceanservice.noaa.gov/deep-seabed-mining/",
        "label": "NOAA Marine Minerals",
        "category": "regulatory",
    },
    "isa_sessions": {
        "url": "https://www.isa.org.jm/sessions",
        "label": "ISA Sessions",
        "category": "regulatory",
    },
    "sec_edgar": {
        "url": f"https://efts.sec.gov/LATEST/search-index?q=%22metals+company%22&dateRange=custom&startdt={(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')}&enddt={datetime.now().strftime('%Y-%m-%d')}",
        "label": "SEC EDGAR",
        "category": "corporate",
    },
    "google_news": {
        "url": "https://news.google.com/rss/search?q=%22The+Metals+Company%22+OR+%22TMC+stock%22+OR+%22polymetallic+nodules%22+OR+%22deep+sea+mining+NOAA%22&hl=en-US&gl=US&ceid=US:en",
        "label": "Google News RSS",
        "category": "news",
    },
}

# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("tmc-agent")

# ─────────────────────────────────────────────────────────────
# CLIENTS
# ─────────────────────────────────────────────────────────────

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
http = httpx.Client(
    timeout=30,
    headers={
        "User-Agent": "TMC-Catalyst-Tracker/1.0 (research bot; contact@example.com)"
    },
    follow_redirects=True,
)


# ─────────────────────────────────────────────────────────────
# 1. DATA SCRAPING
# ─────────────────────────────────────────────────────────────


def scrape_source(key: str, source: dict) -> dict:
    """Fetch and extract text content from a source URL."""
    url = source["url"]
    log.info(f"Scraping {key}: {url}")

    try:
        resp = http.get(url)
        resp.raise_for_status()
    except httpx.HTTPError as e:
        log.warning(f"Failed to fetch {key}: {e}")
        return {"key": key, "url": url, "error": str(e), "content": ""}

    content_type = resp.headers.get("content-type", "")

    # Handle RSS/XML (Google News)
    if "xml" in content_type or key == "google_news":
        return parse_rss(key, url, resp.text)

    # Handle HTML
    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove scripts, styles, navs
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)

    # Truncate to ~4000 chars to stay within token limits
    if len(text) > 4000:
        text = text[:4000] + "\n[...truncated]"

    return {
        "key": key,
        "url": url,
        "label": source["label"],
        "category": source["category"],
        "content": text,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def parse_rss(key: str, url: str, xml_text: str) -> dict:
    """Parse Google News RSS into structured items."""
    soup = BeautifulSoup(xml_text, "html.parser")
    items = []

    for item in soup.find_all("item")[:10]:  # Last 10 articles
        title = item.find("title")
        link = item.find("link")
        pub_date = item.find("pubdate")
        source_tag = item.find("source")

        items.append({
            "title": title.get_text(strip=True) if title else "",
            "url": link.get_text(strip=True) if link else "",
            "published": pub_date.get_text(strip=True) if pub_date else "",
            "source": source_tag.get_text(strip=True) if source_tag else "",
        })

    return {
        "key": key,
        "url": url,
        "label": "Google News",
        "category": "news",
        "content": json.dumps(items, indent=2),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def scrape_all_sources() -> list[dict]:
    """Scrape all configured sources."""
    results = []
    for key, source in SOURCES.items():
        result = scrape_source(key, source)
        results.append(result)
    return results


# ─────────────────────────────────────────────────────────────
# 2. MARKET DATA
# ─────────────────────────────────────────────────────────────


def fetch_market_data() -> Optional[dict]:
    """Fetch current market data for TMC from available API."""

    # Try Financial Modeling Prep first (better free tier)
    if FMP_API_KEY:
        return _fetch_fmp()

    # Fallback to Alpha Vantage
    if ALPHA_VANTAGE_KEY:
        return _fetch_alpha_vantage()

    log.warning("No market data API key configured. Skipping market update.")
    return None


def _fetch_fmp() -> Optional[dict]:
    """Fetch from Financial Modeling Prep API."""
    try:
        # Quote endpoint
        resp = http.get(
            f"https://financialmodelingprep.com/api/v3/quote/{TMC_TICKER}",
            params={"apikey": FMP_API_KEY},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return None

        q = data[0]
        return {
            "price": q.get("price"),
            "price_change_pct": q.get("changesPercentage"),
            "volume": q.get("volume"),
            "avg_volume_30d": q.get("avgVolume"),
            "market_cap": q.get("marketCap"),
            "raw_data": q,
        }
    except Exception as e:
        log.warning(f"FMP API error: {e}")
        return None


def _fetch_alpha_vantage() -> Optional[dict]:
    """Fetch from Alpha Vantage API."""
    try:
        resp = http.get(
            "https://www.alphavantage.co/query",
            params={
                "function": "GLOBAL_QUOTE",
                "symbol": TMC_TICKER,
                "apikey": ALPHA_VANTAGE_KEY,
            },
        )
        resp.raise_for_status()
        data = resp.json().get("Global Quote", {})
        if not data:
            return None

        return {
            "price": float(data.get("05. price", 0)),
            "price_change_pct": float(data.get("10. change percent", "0").strip("%")),
            "volume": int(data.get("06. volume", 0)),
            "raw_data": data,
        }
    except Exception as e:
        log.warning(f"Alpha Vantage API error: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 3. CURRENT DB STATE
# ─────────────────────────────────────────────────────────────


def get_current_state() -> dict:
    """Fetch current DB state for comparison."""
    catalysts = supabase.table("catalysts") \
        .select("*") \
        .order("rank") \
        .execute().data

    news = supabase.table("news_items") \
        .select("*") \
        .order("published_at", desc=True) \
        .limit(20) \
        .execute().data

    config = supabase.table("site_config") \
        .select("*") \
        .single() \
        .execute().data

    milestones = supabase.table("permit_milestones") \
        .select("*") \
        .order("sort_order") \
        .execute().data

    return {
        "catalysts": catalysts,
        "news": news,
        "config": config,
        "milestones": milestones,
    }


# ─────────────────────────────────────────────────────────────
# 4. LLM ANALYSIS
# ─────────────────────────────────────────────────────────────

ANALYSIS_SYSTEM_PROMPT = """You are a financial research agent tracking catalysts for TMC (The Metals Company, NASDAQ: TMC). TMC is a pre-revenue deep-sea mining company seeking permits from NOAA to collect polymetallic nodules from the Clarion-Clipperton Zone in the Pacific Ocean.

You are given:
1. The current state of the catalyst tracker database (catalysts, news, milestones, config)
2. Freshly scraped data from key sources (NOAA, ISA, SEC, TMC IR, Google News)

Your job is to compare the scraped data against the current DB state and identify:
- Status changes on existing catalysts (e.g., "upcoming" → "in_progress")
- New information that updates a catalyst's description or date
- New news articles not already in the database
- Any new catalysts that should be added
- Updates to the permit timeline milestones
- Updates to the site config (permit status, days to decision)

CRITICAL RULES:
- Only report REAL changes backed by the scraped data. Do not fabricate or speculate.
- Respect `agent_locked: true` catalysts — do NOT suggest changes to locked catalysts.
- CATALYST STATUS CLASSIFICATION: This is an investor-facing catalyst tracker. Status must reflect whether the EVENT ITSELF has occurred, NOT whether its effects are ongoing.
  * "upcoming" — The event has a known or estimated future date and has not happened yet (e.g., an upcoming ISA meeting, a scheduled earnings report).
  * "pending" — The event is expected but has no firm date, and we are waiting for a decision or outcome (e.g., waiting for NOAA to issue a permit decision).
  * "in_progress" — The event is actively underway RIGHT NOW with a defined start and end (e.g., a multi-week council session that is currently in session, a public comment period that is currently open).
  * "completed" — The event has happened. Period. Even if the event's effects are ongoing, if the event itself occurred in the past, it is COMPLETED. Examples: An executive order was signed = completed. A capital raise closed = completed. A rule was finalized = completed. A test was finished = completed. Do NOT mark these as "in_progress" just because their effects persist.
  * "cancelled" — The event was called off and will not happen.
- Only "upcoming", "pending", and "in_progress" catalysts are shown on the site. Completed catalysts are hidden. So marking something as completed effectively removes it from the tracker.
- For news deduplication: check headlines against existing news. Don't add duplicates.
- NEWS QUALITY FILTER: 
  * INCLUDE: 
    - Material regulatory filings (NOAA, ISA, SEC Form 8-K/10-Q).
    - Specific dates for hearings, sessions, or public comment periods.
    - Capacity updates (e.g., vessel readiness, nodule processing tests).
    - Geopolitical shifts (e.g., specific mentions of "Project Vault" or EO 14285 progress).
    - Institutional shifts (e.g., major new 13D/G filings or price target changes from reputable banks).
  * EXCLUDE:
    - Retrospective "What If" articles (e.g., "If You Invested $1,000 in 2021...").
    - Generic market listicles (e.g., "3 Mining Stocks to Watch," "Best Stocks Under $10").
    - Automated price-action summaries (e.g., "Why TMC stock dropped 5% today" based purely on technicals).
    - Low-signal "Bull Case" opinion pieces with no new data.
    - AI-generated summaries of old news releases.
- Be conservative. If something is ambiguous, flag it in `manual_review` rather than making a change.

Respond with ONLY valid JSON matching this schema:

{
  "catalyst_updates": [
    {
      "catalyst_id": "uuid",
      "changes": {
        "field_name": "new_value"
      },
      "reason": "Brief explanation of why this changed",
      "source_url": "URL that supports this change"
    }
  ],
  "new_catalysts": [
    {
      "rank": null,
      "category": "regulatory|corporate|market|policy",
      "status": "pending|upcoming|in_progress|completed",
      "title": "...",
      "description": "...",
      "impact": "critical|high|medium|low",
      "date_label": "...",
      "source_url": "...",
      "source_label": "..."
    }
  ],
  "new_news": [
    {
      "source_name": "...",
      "source_url": "...",
      "headline": "...",
      "published_at": "ISO8601",
      "sentiment": "positive|negative|neutral",
      "related_catalyst_ids": []
    }
  ],
  "config_updates": {
    "permit_status_label": "...",
    "permit_status_detail": "...",
    "days_to_decision": 84
  },
  "milestone_updates": [
    {
      "sort_order": 5,
      "changes": { "status": "completed", "date_label": "Feb 2026" },
      "reason": "..."
    }
  ],
  "manual_review": [
    "Description of anything ambiguous that Ryan should check manually"
  ],
  "summary": "2-3 sentence summary of what changed today"
}

If nothing changed, return minimal JSON with empty arrays and summary: "No changes detected."
"""


def analyze_with_llm(scraped_data: list[dict], current_state: dict) -> dict:
    """Send scraped data + current state to Claude for analysis."""
    log.info("Sending data to Claude for analysis...")

    user_message = f"""## Current Database State

### Catalysts
```json
{json.dumps(current_state['catalysts'], indent=2, default=str)}
```

### Recent News (last 20)
```json
{json.dumps(current_state['news'], indent=2, default=str)}
```

### Permit Milestones
```json
{json.dumps(current_state['milestones'], indent=2, default=str)}
```

### Site Config
```json
{json.dumps(current_state['config'], indent=2, default=str)}
```

---

## Freshly Scraped Data (today: {datetime.now(timezone.utc).strftime('%Y-%m-%d')})

"""

    for source in scraped_data:
        if source.get("error"):
            user_message += f"### {source['key']} — ERROR: {source['error']}\n\n"
        else:
            user_message += f"### {source['key']} ({source['label']})\nURL: {source['url']}\n```\n{source['content']}\n```\n\n"

    user_message += "---\n\nAnalyze the scraped data against the current state. What changed? Respond with JSON only."

    response = anthropic.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    # Extract JSON from response
    text = response.content[0].text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]  # Remove first line
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError as e:
        log.error(f"Failed to parse LLM response as JSON: {e}")
        log.error(f"Raw response: {text[:500]}")
        result = {
            "catalyst_updates": [],
            "new_catalysts": [],
            "new_news": [],
            "config_updates": {},
            "milestone_updates": [],
            "manual_review": [f"LLM returned invalid JSON: {str(e)}"],
            "summary": "Agent error: could not parse LLM response.",
        }

    # Track token usage
    result["_tokens"] = {
        "input": response.usage.input_tokens,
        "output": response.usage.output_tokens,
    }

    return result


# ─────────────────────────────────────────────────────────────
# 5. DATABASE WRITES
# ─────────────────────────────────────────────────────────────


def apply_catalyst_updates(updates: list[dict]) -> list[dict]:
    """Apply catalyst updates to Supabase."""
    changes_made = []

    for update in updates:
        catalyst_id = update.get("catalyst_id")
        changes = update.get("changes", {})
        reason = update.get("reason", "")

        if not catalyst_id or not changes:
            continue

        # Fetch current row to build change_log entry
        current = supabase.table("catalysts") \
            .select("*") \
            .eq("id", catalyst_id) \
            .eq("agent_locked", False) \
            .maybe_single() \
            .execute()

        if not current.data:
            log.info(f"Skipping catalyst {catalyst_id} (not found or agent_locked)")
            continue

        row = current.data

        # Build change_log entries
        new_log_entries = []
        for field, new_value in changes.items():
            if field in ("id", "created_at", "updated_at", "change_log", "agent_locked"):
                continue  # Don't allow overwriting these
            old_value = row.get(field)
            if str(old_value) != str(new_value):
                new_log_entries.append({
                    "date": datetime.now(timezone.utc).isoformat(),
                    "source": "agent",
                    "field": field,
                    "old": str(old_value),
                    "new": str(new_value),
                    "reason": reason,
                })

        if not new_log_entries:
            log.info(f"No actual changes for catalyst {catalyst_id}")
            continue

        # Merge change_log
        existing_log = row.get("change_log", []) or []
        merged_log = existing_log + new_log_entries

        # Apply update
        update_data = {**changes, "change_log": merged_log}
        # Remove any fields we don't want the agent to set
        for blocked in ("id", "created_at", "agent_locked"):
            update_data.pop(blocked, None)

        supabase.table("catalysts") \
            .update(update_data) \
            .eq("id", catalyst_id) \
            .eq("agent_locked", False) \
            .execute()

        log.info(f"Updated catalyst {catalyst_id}: {list(changes.keys())}")
        changes_made.append({
            "table": "catalysts",
            "id": catalyst_id,
            "action": "update",
            "fields": list(changes.keys()),
            "reason": reason,
        })

    return changes_made


def apply_new_catalysts(new_catalysts: list[dict]) -> list[dict]:
    """Insert new catalysts. Rank is set to NULL for manual assignment."""
    changes_made = []

    for catalyst in new_catalysts:
        # New catalysts from the agent get a temporary high rank
        # and are flagged for manual review
        max_rank_resp = supabase.table("catalysts") \
            .select("rank") \
            .order("rank", desc=True) \
            .limit(1) \
            .execute()

        next_rank = (max_rank_resp.data[0]["rank"] + 1) if max_rank_resp.data else 1

        insert_data = {
            "rank": next_rank,
            "category": catalyst.get("category", "corporate"),
            "status": catalyst.get("status", "upcoming"),
            "title": catalyst["title"],
            "description": catalyst.get("description", ""),
            "impact": catalyst.get("impact", "medium"),
            "date_label": catalyst.get("date_label", "TBD"),
            "source_url": catalyst.get("source_url"),
            "source_label": catalyst.get("source_label"),
            "agent_locked": False,
            "agent_notes": "Auto-discovered by agent. Please review rank and details.",
        }

        result = supabase.table("catalysts").insert(insert_data).execute()

        if result.data:
            log.info(f"Inserted new catalyst: {catalyst['title']}")
            changes_made.append({
                "table": "catalysts",
                "id": result.data[0]["id"],
                "action": "insert",
                "title": catalyst["title"],
            })

    return changes_made


def apply_new_news(new_news: list[dict], existing_news: list[dict]) -> list[dict]:
    """Insert new news items, deduplicating by headline similarity."""
    changes_made = []
    existing_headlines = {n["headline"].lower().strip() for n in existing_news}

    for item in new_news:
        headline = item.get("headline", "").strip()
        if not headline:
            continue

        # Simple dedup: skip if headline is very similar to existing
        headline_lower = headline.lower()
        if headline_lower in existing_headlines:
            log.info(f"Skipping duplicate news: {headline[:60]}")
            continue

        # Check for fuzzy match (shared words)
        headline_words = set(headline_lower.split())
        is_dupe = False
        for existing in existing_headlines:
            existing_words = set(existing.split())
            overlap = len(headline_words & existing_words) / max(len(headline_words), 1)
            if overlap > 0.7:
                is_dupe = True
                break

        if is_dupe:
            log.info(f"Skipping similar news: {headline[:60]}")
            continue

        insert_data = {
            "source_name": item.get("source_name", "Unknown"),
            "source_url": item.get("source_url", ""),
            "headline": headline,
            "published_at": item.get("published_at", datetime.now(timezone.utc).isoformat()),
            "sentiment": item.get("sentiment"),
            "agent_generated": True,
            "related_catalyst_ids": item.get("related_catalyst_ids", []),
        }

        result = supabase.table("news_items").insert(insert_data).execute()

        if result.data:
            log.info(f"Inserted news: {headline[:60]}")
            existing_headlines.add(headline_lower)
            changes_made.append({
                "table": "news_items",
                "id": result.data[0]["id"],
                "action": "insert",
                "headline": headline,
            })

    return changes_made


def apply_market_data(market_data: Optional[dict]) -> list[dict]:
    """Insert a new market snapshot."""
    if not market_data:
        return []

    insert_data = {
        "price": market_data.get("price"),
        "price_change_pct": market_data.get("price_change_pct"),
        "volume": market_data.get("volume"),
        "avg_volume_30d": market_data.get("avg_volume_30d"),
        "market_cap": market_data.get("market_cap"),
        "raw_data": market_data.get("raw_data"),
    }

    # Remove None values
    insert_data = {k: v for k, v in insert_data.items() if v is not None}

    result = supabase.table("market_snapshots").insert(insert_data).execute()

    if result.data:
        log.info(f"Inserted market snapshot: ${market_data.get('price')}")
        return [{"table": "market_snapshots", "action": "insert", "price": market_data.get("price")}]

    return []


def apply_config_updates(config_updates: dict) -> list[dict]:
    """Update site_config if there are changes."""
    if not config_updates:
        return []

    # Filter out empty/null values
    updates = {k: v for k, v in config_updates.items() if v is not None}
    if not updates:
        return []

    supabase.table("site_config").update(updates).eq("id", 1).execute()

    log.info(f"Updated site_config: {list(updates.keys())}")
    return [{"table": "site_config", "action": "update", "fields": list(updates.keys())}]


def apply_milestone_updates(milestone_updates: list[dict]) -> list[dict]:
    """Update permit milestones."""
    changes_made = []

    for update in milestone_updates:
        sort_order = update.get("sort_order")
        changes = update.get("changes", {})

        if not sort_order or not changes:
            continue

        supabase.table("permit_milestones") \
            .update(changes) \
            .eq("sort_order", sort_order) \
            .execute()

        log.info(f"Updated milestone #{sort_order}: {list(changes.keys())}")
        changes_made.append({
            "table": "permit_milestones",
            "sort_order": sort_order,
            "action": "update",
            "fields": list(changes.keys()),
        })

    return changes_made


# ─────────────────────────────────────────────────────────────
# 6. AGENT RUN LOGGING
# ─────────────────────────────────────────────────────────────


def log_agent_run(
    started_at: datetime,
    sources_checked: list[str],
    changes_made: list[dict],
    news_found: int,
    errors: list,
    tokens: dict,
    summary: str,
    status: str = "completed",
) -> None:
    """Log the agent run to the audit table."""
    supabase.table("agent_runs").insert({
        "started_at": started_at.isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "sources_checked": sources_checked,
        "changes_made": changes_made,
        "news_found": news_found,
        "errors": errors,
        "llm_model": CLAUDE_MODEL,
        "llm_tokens_in": tokens.get("input", 0),
        "llm_tokens_out": tokens.get("output", 0),
        "summary": summary,
    }).execute()


def update_site_scan_meta(status: str = "idle") -> None:
    """Update the last scan time and agent status."""
    supabase.table("site_config").update({
        "last_scan_at": datetime.now(timezone.utc).isoformat(),
        "next_scan_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "agent_status": status,
    }).eq("id", 1).execute()


# ─────────────────────────────────────────────────────────────
# 7. TELEGRAM NOTIFICATION
# ─────────────────────────────────────────────────────────────


def send_telegram(message: str) -> None:
    """Send a notification to Telegram."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        log.info("Telegram not configured. Skipping notification.")
        return

    try:
        http.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
        )
        log.info("Telegram notification sent.")
    except Exception as e:
        log.warning(f"Telegram send failed: {e}")


def format_telegram_message(
    summary: str,
    changes_made: list[dict],
    manual_review: list[str],
    errors: list,
) -> str:
    """Format a clean Telegram notification."""
    lines = ["🔍 <b>TMC Catalyst Tracker — Daily Scan</b>", ""]
    lines.append(summary)
    lines.append("")

    if changes_made:
        lines.append(f"📝 <b>{len(changes_made)} change(s) applied:</b>")
        for change in changes_made[:10]:  # Cap at 10
            table = change.get("table", "")
            action = change.get("action", "")
            detail = change.get("reason") or change.get("headline") or change.get("title") or str(change.get("fields", ""))
            lines.append(f"  • [{table}] {action}: {detail[:80]}")
        lines.append("")

    if manual_review:
        lines.append("⚠️ <b>Needs manual review:</b>")
        for item in manual_review[:5]:
            lines.append(f"  • {item[:100]}")
        lines.append("")

    if errors:
        lines.append(f"❌ <b>{len(errors)} error(s)</b>")
        lines.append("")

    lines.append(f"🕐 {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# 8. MAIN PIPELINE
# ─────────────────────────────────────────────────────────────


def run_agent(dry_run: bool = False, sources_only: bool = False, market_only: bool = False):
    """Execute the full agent pipeline."""
    started_at = datetime.now(timezone.utc)
    all_changes = []
    all_errors = []
    tokens = {}

    log.info("=" * 60)
    log.info("TMC Catalyst Tracker — Agent Run Starting")
    log.info("=" * 60)

    # ── Market data (always runs) ──
    log.info("Step 1: Fetching market data...")
    market_data = fetch_market_data()

    if market_only:
        if not dry_run and market_data:
            changes = apply_market_data(market_data)
            all_changes.extend(changes)
            update_site_scan_meta()
        log.info(f"Market-only run complete. Price: ${market_data.get('price') if market_data else 'N/A'}")
        return

    # ── Scrape sources ──
    log.info("Step 2: Scraping sources...")
    scraped_data = scrape_all_sources()
    sources_checked = [s["url"] for s in scraped_data if not s.get("error")]
    scrape_errors = [s for s in scraped_data if s.get("error")]

    for err in scrape_errors:
        all_errors.append({"source": err["key"], "error": err["error"]})

    log.info(f"  Scraped {len(sources_checked)} sources, {len(scrape_errors)} errors")

    if sources_only:
        for source in scraped_data:
            print(f"\n{'='*40}")
            print(f"SOURCE: {source['key']}")
            print(f"URL: {source['url']}")
            if source.get("error"):
                print(f"ERROR: {source['error']}")
            else:
                print(source["content"][:2000])
        return

    # ── Get current DB state ──
    log.info("Step 3: Loading current database state...")
    current_state = get_current_state()

    # ── LLM analysis ──
    log.info("Step 4: Analyzing with Claude...")
    try:
        analysis = analyze_with_llm(scraped_data, current_state)
        tokens = analysis.pop("_tokens", {})
    except Exception as e:
        log.error(f"LLM analysis failed: {e}")
        all_errors.append({"source": "llm", "error": str(e)})
        analysis = {
            "catalyst_updates": [],
            "new_catalysts": [],
            "new_news": [],
            "config_updates": {},
            "milestone_updates": [],
            "manual_review": [f"LLM call failed: {str(e)}"],
            "summary": "Agent error during LLM analysis.",
        }

    summary = analysis.get("summary", "No summary.")
    manual_review = analysis.get("manual_review", [])

    log.info(f"  Summary: {summary}")
    log.info(f"  Catalyst updates: {len(analysis.get('catalyst_updates', []))}")
    log.info(f"  New catalysts: {len(analysis.get('new_catalysts', []))}")
    log.info(f"  New news: {len(analysis.get('new_news', []))}")
    log.info(f"  Manual review items: {len(manual_review)}")

    if dry_run:
        log.info("DRY RUN — not writing to database.")
        print(json.dumps(analysis, indent=2, default=str))
        return

    # ── Apply changes ──
    log.info("Step 5: Applying changes to database...")

    # Update site status to running
    update_site_scan_meta(status="running")

    # Catalyst updates
    changes = apply_catalyst_updates(analysis.get("catalyst_updates", []))
    all_changes.extend(changes)

    # New catalysts
    changes = apply_new_catalysts(analysis.get("new_catalysts", []))
    all_changes.extend(changes)

    # New news
    changes = apply_new_news(analysis.get("new_news", []), current_state["news"])
    all_changes.extend(changes)

    # Market data
    changes = apply_market_data(market_data)
    all_changes.extend(changes)

    # Config updates
    changes = apply_config_updates(analysis.get("config_updates", {}))
    all_changes.extend(changes)

    # Milestone updates
    changes = apply_milestone_updates(analysis.get("milestone_updates", []))
    all_changes.extend(changes)

    # Update pending/completed counts in site_config
    catalyst_counts = supabase.table("catalysts").select("status").eq("is_visible", True).execute().data
    pending_count = sum(1 for c in catalyst_counts if c["status"] in ("pending", "upcoming", "in_progress"))
    completed_count = sum(1 for c in catalyst_counts if c["status"] == "completed")
    supabase.table("site_config").update({
        "pending_catalysts": pending_count,
        "completed_milestones": completed_count,
    }).eq("id", 1).execute()

    # ── Log run ──
    log.info("Step 6: Logging agent run...")
    news_found = len(analysis.get("new_news", []))

    log_agent_run(
        started_at=started_at,
        sources_checked=sources_checked,
        changes_made=all_changes,
        news_found=news_found,
        errors=all_errors,
        tokens=tokens,
        summary=summary,
    )

    # Update site status to idle
    update_site_scan_meta(status="idle")

    # ── Notify ──
    log.info("Step 7: Sending notification...")
    telegram_msg = format_telegram_message(summary, all_changes, manual_review, all_errors)
    send_telegram(telegram_msg)

    # ── Done ──
    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
    log.info(f"Agent run complete in {elapsed:.1f}s. {len(all_changes)} changes applied.")
    log.info("=" * 60)


# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TMC Catalyst Tracker Agent")
    parser.add_argument("--dry-run", action="store_true", help="Analyze without writing to DB")
    parser.add_argument("--sources-only", action="store_true", help="Only scrape and print raw data")
    parser.add_argument("--market-only", action="store_true", help="Only update market data")
    args = parser.parse_args()

    run_agent(
        dry_run=args.dry_run,
        sources_only=args.sources_only,
        market_only=args.market_only,
    )
