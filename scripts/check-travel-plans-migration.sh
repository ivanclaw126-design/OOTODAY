#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
MIGRATION_FILE="$ROOT_DIR/supabase/migrations/20260422_add_travel_plans.sql"

build_candidate_db_urls() {
  ROOT_DIR_FOR_PY="$ROOT_DIR" python3 - <<'PY'
from pathlib import Path
import os
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value

    return values


def derive_transaction_pooler(url: str | None) -> str | None:
    if not url:
        return None

    parsed = urlparse(url)
    if not parsed.hostname or not parsed.port:
        return None
    if '.pooler.supabase.com' not in parsed.hostname or parsed.port != 5432:
        return None

    return urlunparse(parsed._replace(netloc=f"{parsed.username}:{parsed.password}@{parsed.hostname}:6543"))


def disable_statement_cache(url: str) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["statement_cache_capacity"] = "0"
    return urlunparse(parsed._replace(query=urlencode(query)))


root = Path(os.environ["ROOT_DIR_FOR_PY"])
env_values: dict[str, str] = {}
for env_file in (root / ".env.local", root / ".env"):
    env_values.update(parse_env_file(env_file))

transaction_url = os.environ.get("SUPABASE_TRANSACTION_POOLER_URL") or env_values.get("SUPABASE_TRANSACTION_POOLER_URL")
session_url = os.environ.get("SUPABASE_DB_URL") or env_values.get("SUPABASE_DB_URL")
derived_transaction_url = derive_transaction_pooler(session_url)

seen: set[str] = set()
candidates: list[tuple[str, str]] = []
for label, url in (
    ("transaction", transaction_url),
    ("derived-transaction", derived_transaction_url),
    ("session", session_url),
):
    if not url or url in seen:
        continue
    normalized_url = disable_statement_cache(url)
    candidates.append((label, normalized_url))
    seen.add(normalized_url)

for label, url in candidates:
    print(f"{label}\t{url}")
PY
}

if ! command -v supabase >/dev/null 2>&1; then
  echo "[travel-plans-check] Missing Supabase CLI. Install it first: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "[travel-plans-check] Missing migration file: $MIGRATION_FILE"
  exit 1
fi

echo "[travel-plans-check] Found migration: $(basename "$MIGRATION_FILE")"
echo "[travel-plans-check] Checking remote migration connectivity..."

OUTPUT=""
STATUS=1
USED_STRATEGY="linked"
ATTEMPTED_DB_URLS=false
SUCCESS_DB_URL=""

while IFS=$'\t' read -r label db_url; do
  [ -n "${label:-}" ] || continue
  ATTEMPTED_DB_URLS=true
  echo "[travel-plans-check] Trying ${label} pooler path..."

  set +e
  OUTPUT=$(cd "$ROOT_DIR" && supabase migration list --db-url "$db_url" 2>&1)
  STATUS=$?
  set -e

  if [ $STATUS -eq 0 ]; then
    USED_STRATEGY="$label"
    SUCCESS_DB_URL="$db_url"
    break
  fi

  if ! printf '%s' "$OUTPUT" | grep -qi "i/o timeout\|failed to connect to postgres\|tls error"; then
    echo "$OUTPUT"
    echo "[travel-plans-check] Remote migration check failed before verification completed."
    echo "[travel-plans-check] Next step: fix Supabase login/linkage, then rerun this command."
    exit $STATUS
  fi
done < <(build_candidate_db_urls)

if [ $STATUS -ne 0 ]; then
  if [ "$ATTEMPTED_DB_URLS" = true ]; then
    echo "[travel-plans-check] Pooler paths did not succeed, falling back to linked project check..."
  fi

  set +e
  OUTPUT=$(cd "$ROOT_DIR" && supabase migration list 2>&1)
  STATUS=$?
  set -e
fi

if [ $STATUS -ne 0 ]; then
  echo "$OUTPUT"

  if printf '%s' "$OUTPUT" | grep -qi "i/o timeout\|failed to connect to postgres\|tls error"; then
    echo "[travel-plans-check] Remote database is currently unreachable from this environment."
    echo "[travel-plans-check] Next step: rerun this command from a network that can reach the linked Supabase Postgres endpoint, then run 'supabase db push'."
    exit 2
  fi

  echo "[travel-plans-check] Remote migration check failed before verification completed."
  echo "[travel-plans-check] Next step: fix Supabase login/linkage, then rerun this command."
  exit $STATUS
fi

echo "[travel-plans-check] Connected via ${USED_STRATEGY} path."
echo "$OUTPUT"

if printf '%s' "$OUTPUT" | grep -q "20260422"; then
  echo "[travel-plans-check] Migration is already visible to the linked project."
else
  PUSH_CHECK_CMD=(supabase db push --dry-run)

  if [ -n "$SUCCESS_DB_URL" ]; then
    PUSH_CHECK_CMD+=(--db-url "$SUCCESS_DB_URL")
  fi

  set +e
  PUSH_OUTPUT=$(cd "$ROOT_DIR" && "${PUSH_CHECK_CMD[@]}" 2>&1)
  PUSH_STATUS=$?
  set -e

  if [ $PUSH_STATUS -eq 0 ] && printf '%s' "$PUSH_OUTPUT" | grep -qi "Remote database is up to date"; then
    echo "[travel-plans-check] Remote schema is reachable and already up to date."
  else
    echo "[travel-plans-check] Migration is present locally but not yet applied remotely."
    echo "[travel-plans-check] Next step: run 'supabase db push' once remote connectivity is available."
  fi
fi
