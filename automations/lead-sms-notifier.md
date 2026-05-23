# Lead SMS Notifier Automation

**Trigger:** every 2 minutes
**Channel:** SMS to workspace owner (or specified contact)
**Purpose:** Notifies operations when a new lead is captured by the public form.

## Schedule

```
RRULE: FREQ=MINUTELY;INTERVAL=2
TZ:    America/New_York
```

## Behavior

On each tick:

1. Read `/home/workspace/Documents/Enix/leads.json`.
2. Filter leads where `notified === false`.
3. For each unnotified lead, send SMS containing:
   - Customer name
   - Phone (tap-to-call formatted)
   - Service requested
   - Address (city/state)
   - Message excerpt
   - Received timestamp
4. Set `notified = true` and `notified_at = <ISO now>` on each processed lead.
5. Write the updated array back to `leads.json`.
6. Emit no SMS on empty runs (no spam).

## Cost note

Every 2-minute polling = 720 runs/day = 720 AI-credit transactions, most of which are no-ops. To reduce cost:
- Change to every 5 minutes (`FREQ=MINUTELY;INTERVAL=5`) → 288 runs/day.
- Or switch to event-driven: have the lead API call `/zo/ask` directly to trigger an immediate notification (requires `ZO_API_KEY` in route env).

## SMS routing

Defaults to texting the workspace owner. To route directly to Enix Exteriors' number (e.g. `(865) 685-3649`):

1. Add `Enix Exteriors` as a contact in Zo Settings → Channels → SMS.
2. Edit this automation's instruction to add `contact_name: "Enix Exteriors"` to the `send_sms_to_user` call.

## Equivalent on a real backend

When the Express API is deployed, replace this polling pattern with a webhook from the lead route:

```typescript
// In api/src/routes/leads.ts, after successful insert:
await fetch(SMS_GATEWAY_URL, {
  method: "POST",
  headers: { Authorization: `Bearer ${SMS_TOKEN}` },
  body: JSON.stringify({ to: ENIX_PHONE, message: leadSummary }),
});
```

This eliminates the polling cost and adds zero latency.
