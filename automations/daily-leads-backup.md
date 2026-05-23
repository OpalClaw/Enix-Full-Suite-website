# Daily Leads Backup Automation

**Trigger:** every day at 03:00 America/New_York
**Channel:** none (silent)
**Purpose:** Snapshots `leads.json` to a timestamped backup, prunes old backups.

## Schedule

```
RRULE: FREQ=DAILY;BYHOUR=3;BYMINUTE=0
TZ:    America/New_York
```

## Behavior

1. Read `/home/workspace/Documents/Enix/leads.json`.
2. Create `/home/workspace/Documents/Enix/backups/` if missing.
3. Write a snapshot to `backups/leads-YYYY-MM-DD.json` (skip if empty).
4. Delete any backup file older than 30 days.
5. Log the result. No SMS / email — silent automation.

## Recovery procedure

```bash
ls -la /home/workspace/Documents/Enix/backups/
cp backups/leads-2026-05-22.json leads.json
```

## On a real backend

When the Express API is deployed against PostgreSQL, replace this with:

```bash
# Server crontab — daily 03:00, encrypted, 30-day retention
0 3 * * * pg_dump enix | gzip | age -r $BACKUP_PUBKEY > /var/backups/enix-$(date +\%F).sql.gz.age
0 4 * * * find /var/backups -name 'enix-*.sql.gz.age' -mtime +30 -delete
```

And ship the daily backup to off-site object storage (S3 / R2 / Backblaze).
