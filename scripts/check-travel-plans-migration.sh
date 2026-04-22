#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
MIGRATION_FILE="$ROOT_DIR/supabase/migrations/20260422_add_travel_plans.sql"

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

set +e
OUTPUT=$(cd "$ROOT_DIR" && supabase migration list 2>&1)
STATUS=$?
set -e

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

echo "$OUTPUT"

if printf '%s' "$OUTPUT" | grep -q "20260422_add_travel_plans"; then
  echo "[travel-plans-check] Migration is already visible to the linked project."
else
  echo "[travel-plans-check] Migration is present locally but not yet applied remotely."
  echo "[travel-plans-check] Next step: run 'supabase db push' once remote connectivity is available."
fi
