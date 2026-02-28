"""
regulatory_monitor.py — Scrapes regulatory sources, detects changes, generates AI summaries.
Designed to run via GitHub Actions alongside the existing agent.py.

Required env vars (loaded from .env automatically):
  SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
"""

import os
import hashlib
import json
import re
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError
from pathlib import Path

# ─── Load .env file ───
def load_dotenv():
    """Load environment variables from .env file in project root."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

load_dotenv()

# ─── Config ───
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

SOURCES = {
    "noaa_dsm": {
        "name": "NOAA Deep Seabed Mining",
        "url": "https://oceanservice.noaa.gov/deep-seabed-mining/",
        "description": "NOAA's main DSM page - tracks application status, rulemaking updates, and policy guidance.",
    },
    "regulations_gov": {
        "name": "DSHMRA Docket (Regulations.gov)",
        "url": "https://www.regulations.gov/docket/NOAA-NOS-2025-0108",
        "description": "Federal docket for DSHMRA rulemaking - tracks public comments, new filings, and docket activity.",
    },
    "hr_4018": {
        "name": "HR 4018 - House Bill",
        "url": "https://www.congress.gov/bill/119th-congress/house-bill/4018",
        "description": "House bill related to deep sea mining - tracks bill status, committee actions, votes.",
    },
    "s_2860": {
        "name": "S.2860 - Senate Bill",
        "url": "https://www.congress.gov/bill/119th-congress/senate-bill/2860",
        "description": "Senate bill related to deep sea mining - tracks bill status, committee actions, votes.",
    },
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_page(url: str) -> str:
    """Fetch a page and return its text content."""
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        # Strip HTML tags for cleaner hashing and comparison
        text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    except (URLError, Exception) as e:
        print(f"  ERROR fetching {url}: {e}")
        return ""

def fetch_congress_bill(congress: int, bill_type: str, bill_number: int) -> str:
    """Fetch bill info from congress.gov API. Uses DEMO_KEY or CONGRESS_API_KEY env var."""
    api_key = os.environ.get("CONGRESS_API_KEY", "DEMO_KEY")
    api_url = f"https://api.congress.gov/v3/bill/{congress}/{bill_type}/{bill_number}?api_key={api_key}&format=json"
    req = Request(api_url, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
    })
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        bill = data.get("bill", {})
        parts = [
            f"Bill: {bill.get('type', '')} {bill.get('number', '')} - {bill.get('title', 'N/A')}",
            f"Congress: {bill.get('congress', 'N/A')}",
            f"Status: {bill.get('latestAction', {}).get('text', 'N/A')}",
            f"Latest Action Date: {bill.get('latestAction', {}).get('actionDate', 'N/A')}",
            f"Origin Chamber: {bill.get('originChamber', 'N/A')}",
            f"Update Date: {bill.get('updateDate', 'N/A')}",
        ]
        sponsors = bill.get("sponsors", [])
        if sponsors:
            sponsor_names = [s.get("fullName", "Unknown") for s in sponsors[:5]]
            parts.append(f"Sponsors: {', '.join(sponsor_names)}")
        return "\n".join(parts)
    except (URLError, Exception) as e:
        print(f"  ERROR fetching congress.gov API: {e}")
        return ""


def fetch_regulations_gov_docket(docket_id: str) -> str:
    """Fetch docket info from regulations.gov API (no API key needed for DEMO_KEY)."""
    api_url = f"https://api.regulations.gov/v4/documents?filter[docketId]={docket_id}&api_key=DEMO_KEY&sort=lastModifiedDate&page[size]=25"
    req = Request(api_url, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
    })
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        # Build a text summary from the API response
        parts = [f"Docket: {docket_id}"]
        for doc in data.get("data", []):
            attrs = doc.get("attributes", {})
            parts.append(f"Document: {attrs.get('title', 'N/A')} | Type: {attrs.get('documentType', 'N/A')} | Posted: {attrs.get('postedDate', 'N/A')} | Modified: {attrs.get('lastModifiedDate', 'N/A')}")
        meta = data.get("meta", {})
        if meta.get("totalElements"):
            parts.append(f"Total documents in docket: {meta['totalElements']}")
        return "\n".join(parts)
    except (URLError, Exception) as e:
        print(f"  ERROR fetching regulations.gov API: {e}")
        return ""


def content_hash(text: str) -> str:
    """SHA-256 hash of content for change detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def supabase_request(method: str, path: str, data=None):
    """Make a Supabase REST API request."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  Supabase error ({method} {path}): {e}")
        return None


def get_source_state(source_id: str):
    """Get the current stored hash for a source."""
    result = supabase_request("GET", f"regulatory_sources?source_id=eq.{source_id}&select=*")
    return result[0] if result else None


def update_source_state(source_id: str, new_hash: str, changed: bool):
    """Update the source's last_hash and timestamps."""
    data = {
        "last_hash": new_hash,
        "last_checked": datetime.now(timezone.utc).isoformat(),
        "check_count": None,  # Will increment below
    }
    if changed:
        data["last_changed"] = datetime.now(timezone.utc).isoformat()

    # Use PATCH to update
    supabase_request("PATCH", f"regulatory_sources?source_id=eq.{source_id}", data)

    # Increment check_count via RPC or direct update
    state = get_source_state(source_id)
    if state:
        supabase_request("PATCH", f"regulatory_sources?source_id=eq.{source_id}", {
            "check_count": (state.get("check_count") or 0) + 1,
            "last_hash": new_hash,
            "last_checked": datetime.now(timezone.utc).isoformat(),
            **({"last_changed": datetime.now(timezone.utc).isoformat()} if changed else {}),
        })


def insert_update(source_id: str, source_name: str, source_url: str, new_hash: str, summary: str, snippet: str, status: str):
    """Insert a regulatory update record."""
    supabase_request("POST", "regulatory_updates", {
        "source_id": source_id,
        "source_name": source_name,
        "source_url": source_url,
        "content_hash": new_hash,
        "summary": summary,
        "raw_snippet": snippet[:500],
        "status": status,
    })


def generate_summary(source_name: str, source_desc: str, old_snippet: str, new_snippet: str) -> str:
    """Use Claude to generate a summary of what changed."""
    if not ANTHROPIC_KEY:
        return "Change detected (no AI summary - API key not configured)"

    prompt = f"""You are monitoring a regulatory webpage for changes related to TMC's deep-sea mining permit process.

Source: {source_name}
Description: {source_desc}

Previous content snapshot (first 1000 chars):
{old_snippet[:1000] if old_snippet else "(first check - no previous content)"}

Current content snapshot (first 1000 chars):
{new_snippet[:1000]}

Write a 1-3 sentence summary of what changed or what the current status is. Be specific and factual.
If this is the first check, summarize the current state of the page.
Focus on: bill status, permit milestones, new filings, committee actions, comment periods, or rule changes."""

    req_data = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 300,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = Request(
        "https://api.anthropic.com/v1/messages",
        data=req_data,
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["content"][0]["text"].strip()
    except Exception as e:
        print(f"  Claude API error: {e}")
        return "Change detected (AI summary failed)"


def monitor_source(source_id: str, config: dict):
    """Check a single source for changes."""
    print(f"\n📡 Checking: {config['name']}")
    print(f"   URL: {config['url']}")

    # Fetch current page — use APIs where available
    if source_id == "regulations_gov":
        text = fetch_regulations_gov_docket("NOAA-NOS-2025-0108")
    elif source_id == "hr_4018":
        text = fetch_congress_bill(119, "hr", 4018)
    elif source_id == "s_2860":
        text = fetch_congress_bill(119, "s", 2860)
    else:
        text = fetch_page(config["url"])
    if not text:
        insert_update(source_id, config["name"], config["url"], "", "Failed to fetch page", "", "error")
        return

    new_hash = content_hash(text)
    snippet = text[:500]

    # Get previous state
    state = get_source_state(source_id)
    old_hash = state.get("last_hash") if state else None

    if old_hash is None:
        # First time checking this source
        print("   ℹ️  First check — recording baseline")
        summary = generate_summary(config["name"], config["description"], "", snippet)
        insert_update(source_id, config["name"], config["url"], new_hash, summary, snippet, "initial")
        update_source_state(source_id, new_hash, changed=True)

    elif new_hash != old_hash:
        # Content changed!
        print("   🔔 CHANGE DETECTED!")

        # Get previous snippet for comparison
        prev_updates = supabase_request(
            "GET",
            f"regulatory_updates?source_id=eq.{source_id}&order=detected_at.desc&limit=1&select=raw_snippet"
        )
        old_snippet = prev_updates[0]["raw_snippet"] if prev_updates else ""

        summary = generate_summary(config["name"], config["description"], old_snippet, snippet)
        print(f"   Summary: {summary}")

        insert_update(source_id, config["name"], config["url"], new_hash, summary, snippet, "changed")
        update_source_state(source_id, new_hash, changed=True)

    else:
        print("   ✅ No changes detected")
        update_source_state(source_id, new_hash, changed=False)


def main():
    print("=" * 60)
    print(f"TMC Regulatory Monitor — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        return

    for source_id, config in SOURCES.items():
        try:
            monitor_source(source_id, config)
        except Exception as e:
            print(f"   ❌ Error monitoring {source_id}: {e}")

    print("\n✅ Regulatory monitor complete")


if __name__ == "__main__":
    main()
