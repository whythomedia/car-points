# Car Points

A mobile-first PWA for gamifying family road trips. Parents award points to kids throughout the trip; kids can check the scoreboard, solve a daily riddle for bonus points, and watch the route unfold on a map.

## How it works

- **Scoreboard** — Public dashboard showing each kid's current point total. No login required.
- **Games** — Earn bonus points: a daily riddle (+5/kid) and a flag quiz (+10 once per kid for naming every flag).
- **Admin panel** — Password-protected. Parents can add or deduct points in any increment. Awards trigger a confetti celebration page.
- **Map** — Interactive US map of the trip route with pinch/drag zoom and toggleable art layers (state outlines, animals, labels).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Upstash Redis](https://upstash.com) — serverless KV store for points and vault state
- Deployed on [Vercel](https://vercel.com)

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Points scoreboard |
| `/chores` | Public | Summer daily chores — check-off board + GitHub-style contribution grid |
| `/map` | Public | Trip route map (pinch/drag) — built, not in the nav for now |
| `/games` | Public | Games hub |
| `/bonus` | Public | Daily riddle (+5) |
| `/games/flags` | Public | Flag quiz (+10 once per kid) |
| `/games/plates` | Public | License-plate game — shared 50-state board |
| `/games/reading` | Public | Zoe's Edmark sight-word game (+5/day) |
| `/games/museum` | Signed-in | Text adventure: locked in a museum overnight (+5 once per kid per puzzle) |
| `/celebrate` | Public | Confetti page (`?kid=Name&action=...`) |
| `/admin` | Password | Award/deduct points per kid |

## Local development

\`\`\`bash
npm install
npm run dev
\`\`\`

Requires a \`.env.local\` file (see below). The app seeds default data into Redis on first run if the \`kids\` key doesn't exist.

## Environment variables

\`\`\`
UPSTASH_REDIS_REST_URL=   # From Upstash console
UPSTASH_REDIS_REST_TOKEN= # From Upstash console
ADMIN_PASSWORD=           # Password for /admin panel

# Web push (optional). Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY= # VAPID public key (exposed to the client)
VAPID_PRIVATE_KEY=            # VAPID private key (keep secret)
VAPID_SUBJECT=                # e.g. mailto:you@example.com
\`\`\`

### Push notifications

Installed home-screen PWAs get web-push alerts (iOS 16.4+). The home page shows
a **Turn on alerts** card once the app is added to the Home Screen. Notifications
fire when a new license plate is spotted. If the VAPID keys are unset, push is simply
disabled and the rest of the app is unaffected. Service worker: \`public/sw.js\`.

Add the same variables to your Vercel project settings for production.

## Deployment

\`\`\`bash
cd site
vercel
\`\`\`

Connect a custom domain in the Vercel dashboard and point a CNAME to \`cname.vercel-dns.com\`.

## Customization

- **Kids and avatars** — \`app/page.tsx\` (names and emojis)
- **Admin kids list** — \`app/admin/page.tsx\` and \`app/bonus/BonusClient.tsx\`
- **Riddles** — \`lib/riddles.ts\` (add/edit as needed, rotates by day of year)
- **Flag quiz** — \`lib/games/flagquiz.ts\` (accepted spellings per country). Reward (+10, once per kid) tracked in Redis; games live under \`/games\`.
- **License-plate game** — \`lib/games/states.ts\` (all 50 states). Shared board in Redis; checking a state asks for confirmation. Icons in \`public/stateflags/<slug>.png\` (\`flag: false\` would fall back to an abbreviation badge).
- **Zoe's reading** — \`lib/games/sightwords.ts\` (Edmark Level 1 words in lesson order; \`WORD_EMOJI\` supplies picture cues). Four modes (flashcards, picture→word, hear→type, review cards) with browser TTS audio, +5/day (Zoe only). The active word range and per-word mastery (correct/incorrect + typed misspellings) live in Redis and are managed from **/admin** — add the next word with a click. \`PRACTICE_THROUGH_LESSON\` is just the default before any admin change.
- **The Museum** — a tap-through text adventure. All rules and text live in `lib/games/museum/engine.mjs`, a plain state machine with no browser or server code; `app/games/museum/MuseumClient.tsx` only draws what the engine returns. Each puzzle is a chapter (`lib/games/museum/puzzles.ts`): placing its treasure in the lobby case pays +5, once per kid. Everyone signed in gets their own game, saved on the device every tap and to Redis (`museum:save:<name>`) a moment later, so it works offline and follows the player between devices. The last 300 taps ride along in the save as a play log. Run the scripted playthroughs with `npm run test:museum` after any engine change.
- **Offline support** — \`public/sw.js\` caches the app shell (network-first, cache fallback; bypassed on localhost) and is registered app-wide by \`app/ServiceWorkerRegister.tsx\` in production. The reading game runs fully offline (local TTS voice preferred, emoji pictures, bundled word list); finished rounds are queued in \`localStorage\` and synced when the connection returns.
- **Who's using this (sign-in)** — \`lib/people.ts\` is the canonical roster (4 kids + Mom/Dad, each with roles: kid/parent, reader). The home page sets a \`cp-user\` cookie via \`setCurrentUser\`; \`lib/current-user.ts\` reads it in server components. There's no auth — it's an identity hint. Actions are **restricted** to the signed-in person: you can only check off your own chores. Admin stays password-gated and independent.
- **Daily chores** — \`lib/chores.ts\` (\`SHARED_TASKS\` + per-kid \`CHORE_BY_KID\`; edit these to change the list). Completion is one Redis blob keyed by Central-time day; no points — each kid gets a contribution grid (sequential teal ramp) + streaks. The bottom nav shows Chores in place of Map for now.
- **Route stops** — \`app/map/page.tsx\` (\`STOPS\`/\`ROUTE\`, coordinates in SVG viewBox space)
- **Map art** — \`public/usmap_outlines.png\`, \`usmap_animals.png\`, \`usmap_labels.png\`
- **Flag badges** — circular "ball" flags in \`public/flags/<iso>.png\` (256px), mapped to countries in \`lib/games/flags.ts\` and used by the flag quiz.

## PWA

Installable as a home screen app on iOS and Android. Icons use \`vaughn_80/120/152.png\`. For best Android support, add 192×192 and 512×512 versions to \`public/\` and \`public/manifest.json\`.

## Project history

Originally built as a Flask/Python app with JSONBin storage. Rebuilt in Next.js with Upstash Redis for better mobile performance, simpler deployment, and PWA support.
