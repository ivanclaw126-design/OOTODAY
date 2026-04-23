#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

build_transaction_pooler_url() {
  ROOT_DIR_FOR_PY="$ROOT_DIR" python3 - <<'PY'
from pathlib import Path
import os
from urllib.parse import urlparse, urlunparse


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
    if ".pooler.supabase.com" not in parsed.hostname:
        return None
    if parsed.port != 5432:
        return url

    username = parsed.username or ""
    password = parsed.password or ""
    auth = username
    if password:
        auth = f"{auth}:{password}"

    return urlunparse(parsed._replace(netloc=f"{auth}@{parsed.hostname}:6543"))


root = Path(os.environ["ROOT_DIR_FOR_PY"])
env_values: dict[str, str] = {}
for env_file in (root / ".env.local", root / ".env"):
    env_values.update(parse_env_file(env_file))

transaction_url = env_values.get("SUPABASE_TRANSACTION_POOLER_URL")
session_url = env_values.get("SUPABASE_DB_URL")
candidate = transaction_url or derive_transaction_pooler(session_url)

if not candidate:
    raise SystemExit(1)

print(candidate)
PY
}

mask_db_url() {
  DB_URL_TO_MASK="$1" python3 - <<'PY'
import os

url = os.environ["DB_URL_TO_MASK"]
prefix, rest = url.split("://", 1)
creds, tail = rest.split("@", 1)
user, _ = creds.split(":", 1)
print(f"{prefix}://{user}:***@{tail}")
PY
}

if ! command -v supabase >/dev/null 2>&1; then
  echo "[supabase-ipv4-push] Missing Supabase CLI."
  exit 1
fi

DB_URL=$(build_transaction_pooler_url || true)

if [ -z "$DB_URL" ]; then
  echo "[supabase-ipv4-push] Missing SUPABASE_DB_URL or SUPABASE_TRANSACTION_POOLER_URL in .env.local/.env."
  exit 1
fi

echo "[supabase-ipv4-push] Using transaction pooler URL:"
mask_db_url "$DB_URL"

echo "[supabase-ipv4-push] Dry run..."
supabase db push --db-url "$DB_URL" --dry-run

echo "[supabase-ipv4-push] Applying remote migrations..."
supabase db push --db-url "$DB_URL"
