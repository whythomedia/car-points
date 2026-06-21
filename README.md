# Car Points

A mobile-first PWA for gamifying family road trips. Parents award points to kids throughout the trip; kids can check the scoreboard, solve a daily riddle for bonus points, and watch the route unfold on a map.

## How it works

- **Scoreboard** — Public dashboard showing each kid's current point total. No login required.
- **Daily Vault** — Once per day, any kid can claim +5 points by solving a riddle. First correct answer wins; vault locks until midnight.
- **Admin panel** — Password-protected. Parents can add or deduct points in any increment. Awards trigger a confetti celebration page.
- **Map** — Interactive US map showing the trip route with toggleable art layers (state outlines, animals, labels).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Upstash Redis](https://upstash.com) — serverless KV store for points and vault state
- Deployed on [Vercel](https://vercel.com)

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Points scoreboard |
| `/map` | Public | Trip route map |
| `/bonus` | Public | Daily riddle vault |
| `/worldcup` | Public | 2026 World Cup group-stage predictions |
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
\`\`\`

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
- **Route stops** — \`app/map/page.tsx\` (\`STOPS\` array, coordinates in SVG viewBox space)
- **Map art** — \`public/usmap_outlines.png\`, \`usmap_animals.png\`, \`usmap_labels.png\`
- **World Cup** — \`lib/worldcup/data.ts\` (groups, team power ratings, played results). Edit \`results\` as matches finish, or enter them live from the \`/worldcup\` page. Unplayed matches are predicted by \`lib/worldcup/predict.ts\`; top 2 per group plus the 8 best third-placed teams advance.

## PWA

Installable as a home screen app on iOS and Android. Icons use \`vaughn_80/120/152.png\`. For best Android support, add 192×192 and 512×512 versions to \`public/\` and \`public/manifest.json\`.

## Project history

Originally built as a Flask/Python app with JSONBin storage. Rebuilt in Next.js with Upstash Redis for better mobile performance, simpler deployment, and PWA support.
