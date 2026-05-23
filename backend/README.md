# Enix Exteriors API

Backend replacement for the Base44 SDK. Express 5 + PostgreSQL + Drizzle ORM + JWT auth, designed to run on a Linux VPS behind Nginx.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **Database:** PostgreSQL 16 (via `pg` + Drizzle ORM)
- **Auth:** JWT access + refresh (httpOnly cookies), Argon2id password hashing
- **Validation:** Zod
- **Logging:** Pino (structured, redacted)
- **Security:** Helmet, strict CORS allowlist, rate limiting

## Project layout

```
enix-api/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
├── README.md
└── src/
    ├── index.ts                  # main HTTP server
    ├── auth/
    │   ├── middleware.ts         # requireAuth, requireRole, optionalAuth
    │   └── tokens.ts             # JWT issue/verify, session helpers
    ├── db/
    │   ├── index.ts              # drizzle + pg pool
    │   ├── schema.ts             # all 44 entity tables
    │   ├── migrate.ts            # CLI: apply migrations
    │   └── migrations/           # drizzle-kit generated SQL
    ├── middleware/
    │   └── errorHandler.ts       # central error formatter
    ├── routes/
    │   ├── _crud.ts              # generic CRUD factory
    │   ├── auth.ts               # /api/auth/*
    │   ├── leads.ts              # /api/leads/* (public POST + admin)
    │   ├── jobs.ts               # /api/jobs/* + /:id/smart-data
    │   ├── customers.ts          # /api/customers/*
    │   ├── estimates.ts          # /api/estimates/*
    │   ├── invoices.ts           # /api/invoices/* + payments
    │   └── smartdocs.ts          # /api/smartdocs/* + public /sign
    ├── services/
    │   └── cookies.ts            # auth cookie helpers
    ├── utils/
    │   ├── errors.ts             # HttpError types
    │   └── logger.ts             # Pino instance with redaction
    └── validators/
        └── schemas.ts            # Zod request schemas
```

## Local development

```bash
cd enix-api
cp .env.example .env
# Fill DATABASE_URL, JWT secrets, CORS origins
npm install
npm run db:generate   # generates SQL migrations from schema
npm run db:migrate    # applies them
npm run dev           # tsx watch on src/index.ts
```

## Production deploy (VPS)

```bash
# 1. Server prep (Ubuntu 22.04/24.04)
apt update && apt install -y curl ca-certificates gnupg postgresql nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2

# 2. Database
sudo -u postgres createuser enix_user --pwprompt
sudo -u postgres createdb enix_prime_flow -O enix_user

# 3. App
cd /var/www && git clone <repo> enix-prime-flow && cd enix-prime-flow/api
cp .env.example .env && chmod 600 .env
# Edit .env — set DATABASE_URL, JWT secrets, CORS_ORIGINS
npm ci --omit=dev
npm run build
npm run db:migrate

# 4. PM2
pm2 start dist/index.js --name enix-api
pm2 save && pm2 startup

# 5. Nginx reverse proxy
cat > /etc/nginx/sites-available/enix-api <<'NGINX'
server {
    listen 80;
    server_name api.enixexteriors.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
ln -s /etc/nginx/sites-available/enix-api /etc/nginx/sites-enabled/
certbot --nginx -d api.enixexteriors.com
systemctl reload nginx
```

## API surface (high-level)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/client-login` | public (job# + email) |
| POST | `/api/auth/refresh` | refresh cookie |
| POST | `/api/auth/logout` | optional |
| GET | `/api/auth/me` | required |
| POST | `/api/leads` | public (rate limited, honeypot, TCPA) |
| GET | `/api/leads` | staff |
| GET/PATCH/DELETE | `/api/leads/:id` | staff |
| GET | `/api/jobs` | required (clients filtered) |
| GET | `/api/jobs/:id/smart-data` | required |
| CRUD | `/api/jobs`, `/api/customers`, `/api/estimates`, `/api/invoices` | staff |
| POST | `/api/invoices/:id/payments` | staff |
| POST | `/api/smartdocs/:id/send` | staff |
| GET/POST | `/api/smartdocs/sign/:id/:token` | public, token-gated |
| GET | `/api/health` | public |

## Security defaults

- Argon2id password hashing (interactive params)
- JWT access tokens (15m TTL) + refresh tokens (30d, rotated on use)
- httpOnly + Secure + SameSite=Lax cookies
- Helmet + strict CORS allowlist
- Per-IP rate limiting on `/api/leads`
- All write actions logged to `activity_log`
- All SmartDocs signing logged to `document_audit_log` + `signature_events`
- Sensitive fields redacted in logs (`password`, `token`, `cookie`)
- DB-level FK constraints + unique indexes

## Not yet wired (post-MVP)

- Email sending (SMTP scaffolding in env, no integration yet)
- S3 file storage (uploads use local fs in v1)
- Webhook signature verification (Stripe, EagleView)
- Background workers (BullMQ + Redis) — defer until needed
