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
| `/map` | Public | Trip route map (pinch/drag) |
| `/games` | Public | Games hub |
| `/bonus` | Public | Daily riddle (+5) |
| `/games/flags` | Public | World Cup flag quiz (+10 once per kid) |
| `/games/plates` | Public | License-plate game — shared 50-state board |
| `/worldcup` | Public | 2026 World Cup group-stage predictions |
| `/worldcup/picks` | Public | Family pick'em — predict scores, earn points |
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
- **Route stops** — \`app/map/page.tsx\` (\`STOPS\`/\`ROUTE\`, coordinates in SVG viewBox space)
- **Map art** — \`public/usmap_outlines.png\`, \`usmap_animals.png\`, \`usmap_labels.png\`
- **World Cup** — \`lib/worldcup/fixtures.ts\` is the single source of truth for the schedule (match no, date, kickoff, venue, real home/away, and final score once played). Team power ratings live in \`lib/worldcup/data.ts\`. Enter results live from the \`/worldcup\` page; unplayed matches are predicted by \`lib/worldcup/predict.ts\`. The standings page shows a Through / Likely through / Likely out / Out outlook (confirmed from results, "likely" from the projection). Top 2 per group plus the 8 best third-placed teams advance.
- **Family pick'em** — \`/worldcup/picks\`. Each person predicts a score per match; exact score = 3 pts, correct outcome = 1 pt. Players and their accent colors live in \`lib/worldcup/brand.ts\` (\`PREDICTORS\`); group colors and the \`text_on\` legibility rule come from the same module (per the project style guide). Picks and scores are stored in Redis.
- **Flag badges** — circular "ball" flags in \`public/flags/<iso>.png\` (256px), mapped to teams in \`lib/worldcup/flags.ts\` and rendered by \`app/worldcup/TeamFlag.tsx\` (falls back to the team emoji if an asset is missing).

## PWA

Installable as a home screen app on iOS and Android. Icons use \`vaughn_80/120/152.png\`. For best Android support, add 192×192 and 512×512 versions to \`public/\` and \`public/manifest.json\`.

## Project history

Originally built as a Flask/Python app with JSONBin storage. Rebuilt in Next.js with Upstash Redis for better mobile performance, simpler deployment, and PWA support.
