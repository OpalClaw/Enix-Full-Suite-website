# Enix Exteriors — Deployment Runbook

End-to-end runbook for deploying both the live frontend and the Phase B backend to a fresh Ubuntu 22.04 LTS VPS.

---

## Part 1 — VPS bootstrap (one-time)

```bash
# SSH in as root, then:
adduser enix
usermod -aG sudo enix
rsync -a ~/.ssh /home/enix/ && chown -R enix:enix /home/enix/.ssh

# Lock down SSH
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Updates + fail2ban
apt update && apt upgrade -y
apt install -y fail2ban
systemctl enable --now fail2ban
```

## Part 2 — Dependencies

```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Bun (for the static frontend server)
su - enix -c "curl -fsSL https://bun.sh/install | bash"

# Postgres 15
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER enix WITH PASSWORD '<strong-password>';"
sudo -u postgres psql -c "CREATE DATABASE enix OWNER enix;"

# Nginx + certbot
apt install -y nginx certbot python3-certbot-nginx
```

## Part 3 — Code deploy

```bash
# As the enix user
sudo -u enix -i
mkdir -p ~/apps && cd ~/apps
git clone <your-private-repo-url> enix-exteriors
cd enix-exteriors

# Frontend
cd frontend
cp .env.example .env.local
# Edit .env.local — set VITE_LEAD_API_URL and (when backend is live) VITE_API_BASE_URL, VITE_BACKEND_ENABLED
npm ci
npm run build

# Backend
cd ../backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT secrets, CORS_ORIGINS, COOKIE_DOMAIN, SECURE_COOKIES=true
npm ci
npm run db:generate
npm run db:migrate
npm run build
```

## Part 4 — Systemd services

```bash
# /etc/systemd/system/enix-frontend.service
sudo tee /etc/systemd/system/enix-frontend.service <<'SVC'
[Unit]
Description=Enix Exteriors frontend
After=network.target

[Service]
Type=simple
User=enix
WorkingDirectory=/home/enix/apps/enix-exteriors/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=FORCE_HSTS=1
ExecStart=/home/enix/.bun/bin/bun run serve.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC

# /etc/systemd/system/enix-api.service
sudo tee /etc/systemd/system/enix-api.service <<'SVC'
[Unit]
Description=Enix Exteriors API
After=network.target postgresql.service

[Service]
Type=simple
User=enix
WorkingDirectory=/home/enix/apps/enix-exteriors/backend
EnvironmentFile=/home/enix/apps/enix-exteriors/backend/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC

sudo systemctl daemon-reload
sudo systemctl enable --now enix-frontend enix-api
```

## Part 5 — Nginx

```bash
sudo tee /etc/nginx/sites-available/enix <<'NGINX'
# Frontend
server {
  listen 80;
  server_name enixexteriors.com www.enixexteriors.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# API
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

sudo ln -s /etc/nginx/sites-available/enix /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Part 6 — TLS

```bash
sudo certbot --nginx -d enixexteriors.com -d www.enixexteriors.com -d api.enixexteriors.com \
  --non-interactive --agree-tos -m admin@enixexteriors.com --redirect
# Auto-renew is installed by certbot package — verify with:
sudo systemctl status certbot.timer
```

## Part 7 — Health check & monitoring

```bash
curl -fsS https://enixexteriors.com/healthz   # → "ok"
curl -fsS https://api.enixexteriors.com/api/health   # → {"status":"ok",...}
```

Configure UptimeRobot to ping both `/healthz` and `/api/health` every 5 minutes with SMS alerts on failure.

## Part 8 — Cutover frontend to backend-live mode

```bash
cd /home/enix/apps/enix-exteriors/frontend
echo "VITE_API_BASE_URL=https://api.enixexteriors.com/api" >> .env.local
sed -i 's/^VITE_BACKEND_ENABLED=.*/VITE_BACKEND_ENABLED=true/' .env.local
npm run build
sudo systemctl restart enix-frontend
```

The CRM/portal/SmartDocs routes are now live.

## Part 9 — Updates / rollbacks

```bash
# Update
cd /home/enix/apps/enix-exteriors
git pull
cd frontend && npm ci && npm run build
cd ../backend && npm ci && npm run db:migrate && npm run build
sudo systemctl restart enix-frontend enix-api

# Rollback
git checkout <previous-commit>
# re-run build + restart
```

## Part 10 — Backup strategy

```bash
# /etc/cron.d/enix-backup
0 3 * * * enix pg_dump -U enix enix | gzip > /home/enix/backups/db-$(date +\%F).sql.gz
0 4 * * * enix find /home/enix/backups -name 'db-*.sql.gz' -mtime +30 -delete
```

Off-site copy (recommended): `rclone copy /home/enix/backups remote:enix-backups --max-age 24h`.

## Part 11 — Operational SMS routing

Once Enix's phone number is registered as a Zo contact (or once you're off the Zo-automation path), update `automations/lead-sms-notifier.md` per the instructions there.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `systemctl status enix-frontend` → fails | `journalctl -u enix-frontend -n 50` |
| API returns 503 | Check Postgres is up: `systemctl status postgresql` |
| Lead form submissions fail | Verify CORS origins in `leads-api/enix-lead.ts` include your domain |
| Cookies not setting | Verify `SECURE_COOKIES=true` AND HTTPS, and `COOKIE_DOMAIN` matches |
| 401s on every API call | JWT secrets changed without coordinating frontend rebuild — re-deploy frontend |
