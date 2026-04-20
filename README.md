# barOS

![Node.js 20](https://img.shields.io/badge/node.js-20-green)
![License: AGPL--3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)
![Next.js](https://img.shields.io/badge/framework-Next.js%2015-black)

**barOS** is an open source operating system for modern hospitality venues — built for bars, restaurants, and lounges that are done duct-taping together disconnected tools.

From the first reservation to the last round, barOS unifies your CRM, operations, and loyalty into a single platform your team actually wants to use. And because great hospitality does not stop when the guest walks out the door, barOS comes with a dedicated customer portal — a branded, installable web app where guests log in, track their loyalty points, view their visit history, and feel like they belong.

**Built for the bar. Ready for the whole venue.**

## One OS. Every round, table, and guest.

Whether you are running a cocktail lounge, a neighborhood restaurant, or an urban bar with a rotating crowd — barOS gives you the infrastructure to know your guests, reward loyalty, and operate with confidence.

- 🍸 Guest CRM — track visits, preferences, and history across every touchpoint
- 🎯 Loyalty & rewards — guests log in to their own portal to view points, perks, and redemptions
- 📱 Progressive Web App (PWA) — customers install it on their phone like a native app, no app store required
- 📋 Venue operations — reservations, shifts, inventory, and more in one place
- 🔌 Open & extensible — self-host it, fork it, build on it

### For your guests, it feels like an app.

Customers get their own login to a clean, mobile-first portal — installable straight from their browser. Check points, see visit history, claim rewards. No app store. No friction. Just a great experience that keeps them coming back.

### For your team, it feels like command.

One dashboard. Every table, shift, and guest profile — visible, manageable, and connected.

**Where hospitality meets infrastructure.** Open source. Built for the floor.

## Product screenshots

Images are stored under [`public/screenshots/`](./public/screenshots/) so they render correctly on GitHub and are served at `/screenshots/...` when the app runs.

### Customer portal (guest perspective)

| | |
| --- | --- |
| ![Customer dashboard](./public/screenshots/customer-perspective/Dashboard1.png) | ![Customer dashboard alt view](./public/screenshots/customer-perspective/Dashboard2.png) |
| ![Customer menu](./public/screenshots/customer-perspective/Menu.png) | ![Events and RSVP](./public/screenshots/customer-perspective/Events-and-RVSP.png) |
| ![Loyalty points](./public/screenshots/customer-perspective/Loyalty-points.png) | ![Rewards](./public/screenshots/customer-perspective/Rewards.png) |
| ![Booking](./public/screenshots/customer-perspective/Booking.png) | ![Profile](./public/screenshots/customer-perspective/Profile.png) |
| ![Socials](./public/screenshots/customer-perspective/Socials.png) | |

### Staff and operations (admin perspective)

| | |
| --- | --- |
| ![Dashboard](./public/screenshots/admin-perspective/Dashboard.png) | ![Analytics](./public/screenshots/admin-perspective/Analytics.png) |
| ![Bookings](./public/screenshots/admin-perspective/Bookings.png) | ![Add booking](./public/screenshots/admin-perspective/Add-booking.png) |
| ![Calendar](./public/screenshots/admin-perspective/Calendar.png) | ![Inventory](./public/screenshots/admin-perspective/Inventory.png) |
| ![Menu management](./public/screenshots/admin-perspective/Menu-management.png) | ![Customer](./public/screenshots/admin-perspective/Customer.png) |
| ![Staff management](./public/screenshots/admin-perspective/Staff-management.png) | ![Rewards](./public/screenshots/admin-perspective/Rewards.png) |
| ![Socials](./public/screenshots/admin-perspective/Socials.png) | ![Marketing](./public/screenshots/admin-perspective/Marketing.png) |
| ![Administrative operations submenu](./public/screenshots/admin-perspective/Administrative-Operations-Submenu.png) | ![Events](./public/screenshots/admin-perspective/Events.png) |
| ![Event template](./public/screenshots/admin-perspective/Event%20Template.png) | ![Schedule](./public/screenshots/admin-perspective/Schedule.png) |
| ![Tasks](./public/screenshots/admin-perspective/Tasks.png) | ![Visit tracking](./public/screenshots/admin-perspective/Visit-Tracking.png) |
| ![Notifications](./public/screenshots/admin-perspective/Notifications.png) | ![Profile](./public/screenshots/admin-perspective/Profile.png) |

## Architecture (high level)

```mermaid
flowchart LR
  subgraph client [Browser]
    UI[Next.js App Router]
  end
  subgraph edge [Vercel / Node]
    API[Route handlers with security wrappers]
  end
  subgraph data [Supabase]
    PG[(Postgres + RLS)]
    Auth[Auth]
  end
  UI --> API
  API --> PG
  UI --> Auth
```

## Tech stack

- Next.js 15 + React 19 + TypeScript
- Supabase (Postgres, Auth, RLS)
- Tailwind + shadcn/ui
- Jest + Testing Library

## Quick start

If you have done this kind of thing before:

```bash
git clone https://github.com/stoimenovskiv/barOS.git
cd barOS
npm install
npm run dev
```

Or create a new repository on GitHub and push:

```bash
echo "# barOS" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/stoimenovskiv/barOS.git
git push -u origin main
```

For an existing local tree (after you replace history locally), add the remote and push:

```bash
git remote add origin https://github.com/stoimenovskiv/barOS.git
git branch -M main
git push -u origin main
```

Copy the environment template before running:

- Windows (PowerShell): `Copy-Item .env.example .env.local`
- macOS/Linux: `cp .env.example .env.local`

Then apply schema files in order inside the Supabase SQL editor:

`schemas/01-extensions.sql` through `schemas/11-seed-demo-users.sql`

Full setup: [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)

## Setup flow (detailed)

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill required values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run schema files in order (`schemas/01` to `schemas/11`) from the Supabase SQL editor.
5. Start the app with `npm run dev`.
6. Open `http://localhost:3000` and log in with demo credentials.

## Demo credentials

Only demo credentials are published:

- Admin: `admin@example.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

Defined in `schemas/11-seed-demo-users.sql`.

## Useful scripts

- `npm run dev` — start local app
- `npm run dev:turbo` — start dev server with Turbopack
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run test` — run Jest test suite
- `npm run test:ci` — CI tests
- `npm run verify:schema` — verify canonical schema parity with CSV source
- `npm run verify:secrets` — scan tracked files for credential leaks
- `npm run verify:all` — run all quality, security, and schema checks

## Deployment and environment

Required production environment variables are documented in [`docs/deployment/environment.md`](./docs/deployment/environment.md).

## Troubleshooting

- **App fails on startup**: check `.env.local` values and the Supabase project URL and key pair.
- **Auth or permission errors**: re-apply `schemas/08-rls-policies.sql` and confirm the full schema sequence was applied.
- **Schema verify fails**: regenerate canonical schema from CSV using `node scripts/tools/generate-canonical-schema-from-csv.mjs "<path-to-csv>"`
- **CI verify fails**: run `npm run verify:all` locally to identify the first failing check.

## Project structure

- `src/` — application routes, UI, APIs, stores, and libraries
- `schemas/` — canonical SQL schema, policies, and seed files
- `scripts/verify/` — verification checks used in CI
- `docs/` — architecture, quickstart, security, and deployment documentation

## Why some files stay at the root

These root files are intentionally placed by Next.js and Sentry conventions:

- `instrumentation.ts` — Next.js server instrumentation hook entrypoint
- `instrumentation-client.ts` — client and runtime instrumentation hook entrypoint
- `sentry.server.config.ts` — Sentry server runtime config imported by `instrumentation.ts`
- `sentry.edge.config.ts` — Sentry edge runtime config imported by `instrumentation.ts`

Moving them out of the root breaks automatic runtime discovery by the framework.

## Contributing and security

- Contributing: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- Open-source use under AGPL-3.0
- Commercial use requires a paid license from the maintainer
- Details: [`LICENSE`](./LICENSE) and [`COMMERCIAL_LICENSE.md`](./COMMERCIAL_LICENSE.md)
