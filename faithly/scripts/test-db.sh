#!/usr/bin/env bash
# Applies every migration + the Bible text to a throwaway local Postgres database
# and runs the RLS tests. Requires psql and a running Postgres you can connect to.
#   PGHOST=/var/run/postgresql PGUSER=postgres ./scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${TEST_DB:-faithly_test}
PSQL="psql -q -v ON_ERROR_STOP=1"
$PSQL -d postgres -c "drop database if exists $DB" -c "create database $DB"
$PSQL -d "$DB" -f supabase/tests/auth_stub.sql
for f in supabase/migrations/*.sql; do $PSQL -d "$DB" -f "$f"; done
TMP=$(mktemp)
node scripts/import-bible.mjs --sql "$TMP" >/dev/null
$PSQL -d "$DB" -f "$TMP"
rm -f "$TMP"
$PSQL -d "$DB" -f supabase/tests/rls_test.sql
