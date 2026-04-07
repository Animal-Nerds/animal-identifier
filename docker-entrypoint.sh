#!/bin/sh
set -e

# Push DB schema on startup (idempotent — safe to run every time)
echo "Pushing database schema..."
npx drizzle-kit push --config ./drizzle.config.ts --force 2>&1 || echo "Schema push failed — DB may not be ready yet"

echo "Starting app on port ${PORT:-3000}..."
exec node build
