# Blimp tracker → Car Points: integration guide

This is the receiving end of the N3A blimp notifier. Your home-desktop poller
sends sightings here; the app turns them into push notifications and updates the
"Goodyear Blimp" card on the homepage.

If you wrote the `NOTIFY_ENDPOINT_SPEC.md` handoff — this is the built version,
with a few deliberate differences noted under **Differences from the spec**.

---

## Endpoint

```
POST https://car.smithlets.net/api/blimp-alert
Authorization: Bearer <BLIMP_ALERT_SECRET>
Content-Type: application/json
```

- **Auth:** a single static bearer token. It must exactly match the
  `BLIMP_ALERT_SECRET` environment variable set in Vercel.
- **Rotation:** change `BLIMP_ALERT_SECRET` in Vercel (redeploy) and in your job
  config at the same time. A mismatch returns `401`.
- **Fail-closed:** if the secret isn't set on the server, every call returns
  `503` — the endpoint never runs unauthenticated.

The key lives only in Vercel env + your job's local config. Never commit it.

---

## Request body

```json
{
  "event": "airborne",
  "registration": "N3A",
  "timestamp": "2026-06-25T18:00:00Z",
  "position": {
    "lat": 31.7619,
    "lon": -106.4850,
    "alt_baro": 1200,
    "gs": 28,
    "track": 95
  },
  "message": "N3A is airborne near El Paso"
}
```

| Field            | Required | Notes |
|------------------|----------|-------|
| `event`          | **yes**  | One of `airborne`, `landed`, `position`. Case-insensitive. Missing → `400`. |
| `registration`   | no       | If present it **must** be `N3A` (case-insensitive); anything else is accepted-and-ignored (`204`, no-op). |
| `timestamp`      | no       | ISO-8601 UTC (`...Z`). If absent/unparseable we use server time. |
| `position`       | no       | See below. May be omitted entirely. |
| `position.lat`   | —        | Required *within* position. Must be a finite number in `[-90, 90]`. |
| `position.lon`   | —        | Required *within* position. Must be a finite number in `[-180, 180]`. |
| `position.alt_baro` | —     | Optional. Feet. Non-numeric is treated as "unknown". |
| `position.gs`, `position.track` | — | Accepted but currently unused. |
| `message`        | no       | Free text. Used **only** as a fallback notification body when no position is present (see below). Sanitized; capped at 180 chars. |

If `position` is present but `lat`/`lon` are missing or out of range, the whole
position is discarded (treated as "no position"), not rejected.

---

## What each event does

| Event       | Sends a push? | Updates the homepage card? |
|-------------|---------------|----------------------------|
| `airborne`  | ✅ yes (deduped) | ✅ if it carries a valid position |
| `landed`    | ✅ yes (deduped) | ✅ if it carries a valid position |
| `position`  | ❌ no (silent)   | ✅ if it carries a valid position |
| *(unknown)* | ❌ no            | ✅ if it carries a valid position |

- **The card update happens for any event with valid coordinates**, regardless
  of type. So even a bare `position` keeps "last seen near …" fresh.
- **Only `airborne`/`landed` notify**, so adding periodic `position` pings later
  won't spam phones.

### Notification text

We compose the push body **server-side from the coordinates**, e.g.
`It's up! Flying near El Paso, TX · 1,200 ft` (the place name is reverse-geocoded
from lat/lon). Your `message` is used **only** when an event has no usable
position. So: send a position whenever you have one and you'll get a nicer,
consistent notification — and `message` is just a safety net.

### Dedupe

`airborne` and `landed` are deduplicated **per event type for 15 minutes**
(atomic, server-side). A network retry or a double-fire can't double-ping. The
card update is **not** deduped — re-sending a fresher position always updates it.

---

## Responses

| Code  | Meaning | What your job should do |
|-------|---------|-------------------------|
| `204` | Accepted (incl. deduped / ignored non-N3A / unknown event). | Log success, move on. |
| `400` | Missing `event`, invalid JSON, or non-object body. | Fix the payload; don't retry as-is. |
| `401` | Missing/incorrect bearer token. | Check the key matches Vercel; don't hammer. |
| `503` | `BLIMP_ALERT_SECRET` not configured on the server. | Transient (deploy/config) — back off and retry later. |

There is **no `429`**. Treat **any 2xx (you'll get `204`) as success.**

---

## How best to use it

- **Fire `airborne` once per flight**, on the silent→broadcasting transition, and
  re-arm only after N3A has been gone for a while (your ~15-min gap matches our
  dedupe window nicely).
- **Always include `position` when you have a fix** — it powers both the card and
  the notification wording. An `airborne` with no position still works, but the
  push falls back to your `message` and the card won't move.
- **Timestamps in UTC ISO-8601** (`2026-06-25T18:00:00Z`).
- **Retries:** safe. On network error or `503`, retry a few times with backoff;
  dedupe makes a successful-but-retried `airborne` harmless.
- **Optional periodic `position`:** if you want the card to track the blimp live
  during a flight, send `position` every few minutes. Don't go faster than you
  need — it only refreshes a card, and there's no benefit to sub-minute updates.
- **`landed`** (optional): send it when N3A goes quiet/lands; it pushes a
  "back on the ground near …" note and leaves the card on the final position.

---

## Test it

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://car.smithlets.net/api/blimp-alert" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "airborne",
    "registration": "N3A",
    "timestamp": "2026-06-25T18:00:00Z",
    "position": { "lat": 31.7619, "lon": -106.4850, "alt_baro": 1200 }
  }'
```

Expected: `204`, a push to subscribed devices, and the homepage card showing
"Last seen near El Paso, TX". Wrong key → `401`. Secret unset in Vercel → `503`.

---

## Differences from the original spec

- **Path/auth/shape unchanged** — your existing payload works as-is.
- Added a side effect: **any event with coordinates updates the homepage card**
  (`recordBlimpSighting`), making your poller our primary position source.
- **`position` events are silent** (card-only); only `airborne`/`landed` push.
- **Notification body is built from coordinates**, not your `message` — `message`
  is a sanitized fallback. (Defense-in-depth: even though the key gates the
  endpoint, we don't let an inbound string be the sole thing that reaches a
  phone.)
- **No `429`** — dedupe covers retries; any 2xx means accepted.
