#!/usr/bin/env bash
set -e
# Drop platform-truncated env vars; rely entirely on .env via set -a / source
unset DATABASE_URL CORS_ORIGINS JWT_ACCESS_SECRET JWT_REFRESH_SECRET PGSSLMODE
set -a
. /home/workspace/Projects/Enix-Full-Suite-website/backend/.env
set +a
exec node /home/workspace/Projects/Enix-Full-Suite-website/backend/dist/index.js
