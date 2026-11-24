#!/usr/bin/env bash
# Spins up a throwaway local Postgres, loads a minimal stand-in for Supabase's
# auth schema, applies the EventFill migration, and runs the RLS isolation tests.
set -euo pipefail
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)
DIR=$(mktemp -d)
PORT=${PGPORT_TEST:-55432}
# Postgres refuses to run as root; use the "postgres" OS user in that case.
RUN=()
if [ "$(id -u)" = "0" ]; then chown postgres "$DIR"; RUN=(runuser -u postgres --); fi
"${RUN[@]}" "$PGBIN/initdb" -D "$DIR" -U postgres --auth=trust >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DIR" -o "-p $PORT -k $DIR -c listen_addresses=localhost" -l "$DIR/log" start -w >/dev/null
trap '"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DIR" stop >/dev/null; rm -rf "$DIR"' EXIT
export TEST_DATABASE_URL="postgresql://postgres@localhost:$PORT/postgres"
psql "$TEST_DATABASE_URL" -q -v ON_ERROR_STOP=1 -f tests/db/supabase-stub.sql
psql "$TEST_DATABASE_URL" -q -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
npx vitest run tests/db
