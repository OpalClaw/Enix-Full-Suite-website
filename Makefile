# Enix Exteriors Full Suite — orchestration Makefile
# Standard targets per OpalSageLabs convention: install, build, test, lint,
# typecheck, format, docker, deploy. Every target is idempotent.

SHELL := /bin/bash
.DEFAULT_GOAL := help
.SHELLFLAGS := -eu -o pipefail -c
.PHONY: help install install-frontend install-backend install-leads-api \
        build build-frontend build-backend \
        dev dev-frontend dev-backend dev-leads-api \
        lint typecheck test test-frontend test-backend test-leads-api \
        audit secret-scan license-check \
        db-up db-down migrate migrate-generate seed \
        docker-build docker-up docker-down \
        clean format

# ---------- Help ----------
help:  ## Print this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---------- Install ----------
install: install-frontend install-backend install-leads-api  ## Install all three components

install-frontend:  ## Install frontend deps
	cd frontend && npm install --no-fund --no-audit

install-backend:  ## Install backend deps
	cd backend && npm install --no-fund --no-audit

install-leads-api:  ## Install leads-api deps (Bun)
	cd leads-api && bun install

# ---------- Build ----------
build: build-frontend build-backend  ## Build all three components

build-frontend:  ## Build frontend (Vite)
	cd frontend && npm run build

build-backend:  ## Build backend (TypeScript -> dist/)
	cd backend && npm run build

# ---------- Dev ----------
dev:  ## Run all three dev servers concurrently
	@command -v concurrently >/dev/null || npm i -g concurrently
	concurrently -n FE,BE,LEADS -c blue,green,magenta \
		"cd frontend && npm run dev" \
		"cd backend && npm run dev" \
		"cd leads-api && bun --watch enix-lead.ts"

dev-frontend:  ## Frontend only
	cd frontend && npm run dev

dev-backend:  ## Backend only (tsx watch)
	cd backend && npm run dev

dev-leads-api:  ## Leads-API only
	cd leads-api && bun --watch enix-lead.ts

# ---------- Quality ----------
lint:  ## Run ESLint across all components
	cd frontend && npm run lint
	cd backend && npm run lint

typecheck:  ## Type-check all components
	cd frontend && npm run typecheck
	cd backend && npx tsc --noEmit
	cd leads-api && bun run typecheck

test: test-frontend test-backend test-leads-api  ## Run all test suites

test-frontend:
	cd frontend && npm test --if-present

test-backend:
	cd backend && npm test --if-present

test-leads-api:
	cd leads-api && bun test --if-present

# ---------- Security ----------
audit:  ## npm audit (HIGH+CRITICAL = fail) on all components
	cd frontend && npm audit --omit=dev --audit-level=high
	cd backend  && npm audit --omit=dev --audit-level=high
	cd leads-api && npm audit --omit=dev --audit-level=high || true

secret-scan:  ## Scan repo for committed secrets via gitleaks
	@command -v gitleaks >/dev/null || (echo "gitleaks not installed; see https://github.com/gitleaks/gitleaks" && exit 1)
	gitleaks detect --source . --no-banner --redact

license-check:  ## Verify no GPL/AGPL/LGPL in production deps
	@command -v license-checker-rseidelsohn >/dev/null || npm install -g license-checker-rseidelsohn
	cd frontend && license-checker-rseidelsohn --production --excludePrivatePackages --failOn "GPL-2.0;GPL-3.0;AGPL-1.0;AGPL-3.0;LGPL-2.0;LGPL-3.0"
	cd backend  && license-checker-rseidelsohn --production --excludePrivatePackages --failOn "GPL-2.0;GPL-3.0;AGPL-1.0;AGPL-3.0;LGPL-2.0;LGPL-3.0"

# ---------- Database ----------
db-up:  ## Start local Postgres in Docker
	docker run -d --name enix-pg --rm \
		-e POSTGRES_USER=enix -e POSTGRES_PASSWORD=enix -e POSTGRES_DB=enix \
		-p 5432:5432 postgres:16-alpine
	@sleep 3

db-down:  ## Stop local Postgres
	docker stop enix-pg || true

migrate:  ## Run Drizzle migrations
	cd backend && npm run db:migrate

migrate-generate:  ## Generate a new Drizzle migration
	cd backend && npm run db:generate

seed:  ## Seed the database (creates default tenant + admin)
	cd backend && tsx src/db/seed.ts

# ---------- Docker ----------
docker-build:  ## Build Docker images
	docker compose -f docker/docker-compose.yml build

docker-up:  ## Start full stack via docker compose
	docker compose -f docker/docker-compose.yml up -d

docker-down:
	docker compose -f docker/docker-compose.yml down

# ---------- Utility ----------
format:  ## Apply Prettier across all components
	@command -v prettier >/dev/null || npm install -g prettier
	prettier --write "frontend/src/**/*.{js,jsx,ts,tsx,css}"
	prettier --write "backend/src/**/*.ts"
	prettier --write "leads-api/*.ts"

clean:  ## Remove build artifacts
	rm -rf frontend/dist frontend/node_modules
	rm -rf backend/dist backend/node_modules
	rm -rf leads-api/node_modules
