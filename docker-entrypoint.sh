#!/bin/sh
set -e

# docker-entrypoint.sh
#
# SQLite database schema is initialized at build time via `prisma db push`.
# Seed copy is stored at /app/prisma/seed/dev.db.
# Copies the seed database into volume mount at /app/prisma/data on first run.

DB_PATH="/app/prisma/data/dev.db"
SEED_PATH="/app/prisma/seed/dev.db"

if [ ! -f "$DB_PATH" ]; then
  echo "[entrypoint] First run detected: seeding database from build..."
  cp "$SEED_PATH" "$DB_PATH"
  echo "[entrypoint] Database ready at $DB_PATH"
else
  echo "[entrypoint] Existing database found at $DB_PATH"
fi

exec "$@"
