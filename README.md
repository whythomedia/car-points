# Car Points

A mobile-first PWA for gamifying family road trips. Parents award points to kids throughout the trip; kids can check the scoreboard, solve a daily riddle for bonus points, and watch the route unfold on a map.

## How it works

- **Scoreboard** — Public dashboard showing each kid's current point total. No login required.
- **Games** — Earn bonus points: a daily riddle (+5/kid) and a World Cup flag quiz (+10 once per kid for naming every flag).
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
| `/games/flags` | Public | World Cup flag quiz (+10 once per kid) |
| `/games/plates` | Public | License-plate game — shared 50-state board |
| `/games/reading` | Public | Zoe's Edmark sight-word game (+5/day) |
| `/worldcup` | Public | Family pick'em — predict scores, earn points (leaderboard) |
| `/worldcup/knockout` | Public | Knockout bracket (R32 → Final) — tracker + picks |
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
fire when a new license plate is spotted and when a World Cup result is entered
(with the updated leaderboard). If the VAPID keys are unset, push is simply
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
- **Offline support** — \`public/sw.js\` caches the app shell (network-first, cache fallback; bypassed on localhost) and is registered app-wide by \`app/ServiceWorkerRegister.tsx\` in production. The reading game runs fully offline (local TTS voice preferred, emoji pictures, bundled word list); finished rounds are queued in \`localStorage\` and synced when the connection returns.
- **Who's using this (sign-in)** — \`lib/people.ts\` is the canonical roster (4 kids + Mom/Dad, each with roles: kid/parent, predictor, reader). The home page sets a \`cp-user\` cookie via \`setCurrentUser\`; \`lib/current-user.ts\` reads it in server components. There's no auth — it's an identity hint. Actions are **restricted** to the signed-in person: you can only check off your own chores, and only pool players (Dad/Mom/Max/Owen) can make World Cup picks (others view). Admin stays password-gated and independent.
- **Daily chores** — \`lib/chores.ts\` (\`SHARED_TASKS\` + per-kid \`CHORE_BY_KID\`; edit these to change the list). Completion is one Redis blob keyed by Central-time day; no points — each kid gets a contribution grid (sequential teal ramp) + streaks. The bottom nav shows Chores in place of Map for now.
- **Route stops** — \`app/map/page.tsx\` (\`STOPS\`/\`ROUTE\`, coordinates in SVG viewBox space)
- **Map art** — \`public/usmap_outlines.png\`, \`usmap_animals.png\`, \`usmap_labels.png\`
- **World Cup** — \`/worldcup\` is the section landing: the family pick'em leaderboard and per-match picks. Group fixtures/results live in \`lib/worldcup/fixtures.ts\` + \`store.ts\`; the knockout bracket (M73–M104) lives in \`lib/worldcup/bracket.ts\` with results in \`ko-store.ts\`. \`lib/worldcup/leaderboard.ts\` builds one combined standing across both stages.
- **Family pick'em** — \`/worldcup\`. Each person predicts a score per match; exact score = 3 pts, correct outcome = 1 pt. Knockout matches appear once their teams are set and score the same way, with "advances" as the outcome (penalty toggle for level scores). Players/colors live in \`lib/worldcup/brand.ts\` (\`PREDICTORS\`). Picks and scores are stored in Redis.
- **Knockout bracket** — \`/worldcup/knockout\` renders R32 → Final round by round; entering a result auto-advances the winner via \`resolveBracket()\`. Built from the official FIFA match numbers; later rounds fill in as earlier ones finish.
- **Flag badges** — circular "ball" flags in \`public/flags/<iso>.png\` (256px), mapped to teams in \`lib/worldcup/flags.ts\` and rendered by \`app/worldcup/TeamFlag.tsx\` (falls back to the team emoji if an asset is missing).

## PWA

Installable as a home screen app on iOS and Android. Icons use \`vaughn_80/120/152.png\`. For best Android support, add 192×192 and 512×512 versions to \`public/\` and \`public/manifest.json\`.

## Project history

Originally built as a Flask/Python app with JSONBin storage. Rebuilt in Next.js with Upstash Redis for better mobile performance, simpler deployment, and PWA support.
