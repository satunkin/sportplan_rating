## Кубок Циклон · 2026

Current local runtime:
- `Next.js app router`
- `Prisma client`
- local / hosted DB: `PostgreSQL`
- schema management: `Prisma migrations`
- athlete interface: `Telegram webhook bot`

The app runtime is now PostgreSQL-first. `DATABASE_URL` can point directly to a hosted Postgres instance, and `DATABASE_URL_POSTGRES` remains as a convenient fallback while the final env layout is being stabilized.

## Local Dev

1. Install dependencies.
2. Copy `.env.example` to `.env` and fill only the fields you need for the current stage.
3. Apply Prisma migrations.
4. Start the app.

```bash
npm install
npm run db:status
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Main product routes:
- `/` — top-10 male and female rating with expandable history;
- `/leaderboard` — full rating with search, filters and pagination;
- `/events` — future and past competitions;
- `/cabinet` — athlete profile or administrator workspace, depending on the active session;
- `/api/telegram/webhook` — Telegram webhook.

`Competition` is the parent event entity. The existing Prisma `Event` model is
kept as the compatible physical model for one competition distance.

The `.env.example` file now contains:
- a slot for `DATABASE_URL_POSTGRES` using Supabase session or direct connection;
- preferred `DATABASE_URL` / `DIRECT_URL` placeholders for a Supabase-style production layout;
- SMTP and admin auth fields for the magic-link deployment path.

Athlete auth flow:
- `/register` creates the athlete profile and stores a password hash in PostgreSQL;
- `/login` now treats email magic link as the primary login path;
- the password form remains as a temporary fallback for already created local accounts;
- in local/dev mode without SMTP config, the UI shows a direct preview link instead of sending a real email.

Admin auth setup:

```bash
npm run admin:hash-password -- "strong-admin-password"
```

Put the printed value into `ADMIN_PASSWORD_HASH` and set `ADMIN_EMAIL`. `ADMIN_ACCESS_KEY` now acts only as a temporary fallback for local/dev access if the stronger credentials are not configured yet.

Optional local/dev demo data:

```bash
npm run db:seed:demo
```

The demo seed is safe to rerun in a test environment. It upserts demo athletes, events, submissions, verified results, and recalculated rankings instead of wiping the whole database. To preview or remove the known demo dataset:

```bash
npm run db:clear:demo
npm run db:clear:demo -- --apply
```

## Database Commands

Current runtime:

```bash
npm run db:status
npm run db:deploy
npm run db:push
```

PostgreSQL checks:

```bash
npm run prisma:generate:postgres
npm run prisma:validate:postgres
npm run db:baseline:postgres
npm run db:smoke:postgres
npm run db:seed:demo
npm run db:clear:demo
npm run db:check:cyclon-migration
```

What these PostgreSQL commands do:
- validate that the canonical Prisma datamodel is PostgreSQL-compatible;
- generate `prisma/postgres/baseline.sql` as an initial SQL snapshot from the canonical schema;
- run a minimal PostgreSQL runtime smoke check with `@prisma/adapter-pg`;
- seed or refresh the demo snapshot in a non-destructive way;
- preview or remove the known demo snapshot without touching imported protocol rows.

If Prisma migrate cannot work through a Supabase session pooler, the project has
a transaction-safe fallback for the single Cyclon migration:

```bash
npm run db:apply:cyclon-migration
```

## Telegram Bot

Required variables:
- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_WEBHOOK_SECRET`;
- `NEXT_PUBLIC_TELEGRAM_BOT_URL`;
- public `APP_BASE_URL`.

After deployment, register the webhook:

```bash
npm run telegram:set-webhook
```

The bot supports onboarding, safe linking to an existing athlete, result
submission, proposed competitions/clubs/coaches, profile editing, personal
rating and moderated update/delete requests. `TelegramUpdate` protects webhook
processing from repeated Telegram delivery.

Current limitation:
- the legacy athlete magic-link login requires a real SMTP provider;
- hosted deploy still needs final production env values and a full browser-level smoke test;
- demo seed is a CLI-only dev/test helper; use `npm run db:clear:demo` to preview cleanup before applying it.

## Environment

- `DATABASE_URL`: primary runtime PostgreSQL connection string.
- `DIRECT_URL`: PostgreSQL connection string for Prisma CLI and migrations. On Supabase, use the direct host when your environment can reach it; if local Prisma commands fail against the IPv6-only direct host, use the session pooler on `5432`.
- `DATABASE_URL_POSTGRES`: transitional fallback PostgreSQL connection string used while moving older envs and scripts.
- `APP_BASE_URL`: public base URL used inside magic-link emails.
- `EMAIL_FROM`: sender address shown in magic-link emails.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`: SMTP settings for real email delivery.
- `ADMIN_EMAIL`: admin login identifier for the stronger website admin auth flow.
- `ADMIN_PASSWORD_HASH`: scrypt hash in `salt:hash` format for admin password verification.
- `ADMIN_ACCESS_KEY`: temporary fallback passphrase for local/dev access when stronger admin credentials are not configured.
- `SESSION_SECRET`: cookie signing secret.
- `TELEGRAM_BOT_TOKEN`: server-only BotFather token.
- `TELEGRAM_WEBHOOK_SECRET`: secret Telegram webhook header.
- `NEXT_PUBLIC_TELEGRAM_BOT_URL`: public `https://t.me/...` bot link.

## Next Infra Goal

Finish the hosted production path around the new PostgreSQL runtime: SMTP, deploy envs, and end-to-end checks.

## Hosted Deployment

Recommended default:
- `Vercel Hobby` for the non-commercial Next.js app and Telegram webhook
- `Supabase PostgreSQL` for the hosted database
- SMTP is optional while Telegram is the primary athlete interface

Before the first hosted deploy:

```bash
npm run deploy:check
```

What `npm run deploy:check` now validates:
- `DATABASE_URL` must point to PostgreSQL
- `DIRECT_URL` should point to a direct PostgreSQL connection for Prisma CLI
- `APP_BASE_URL` must point to the public website URL
- `SESSION_SECRET` must be set
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` must be configured
- SMTP is optional; without it, the legacy athlete magic-link login is unavailable
- `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` should be configured
- the PostgreSQL server must be reachable with the runtime URL
- the core Prisma-managed tables must already exist
- when SMTP is configured, the SMTP server must accept a verification handshake

Health endpoint:

```text
/api/health
```

It returns:
- `200` when the current runtime looks deployment-ready
- `503` when blockers still exist, with a JSON list of blockers and warnings

Practical Vercel path:
1. Connect the GitHub repository `satunkin/sportplan_rating` to the Vercel project.
2. Set the Vercel project Root Directory to `web`.
3. Add the production variables from `.env.example` in Vercel project settings. Never commit real secrets.
4. Use the Supabase transaction pooler URL for `DATABASE_URL`.
5. Set `APP_BASE_URL=https://plansporta.ru`.
6. Deploy first to `sportplan-rating.vercel.app` and open `/api/health`.
7. After the preview passes, attach `plansporta.ru` and `www.plansporta.ru`.
8. Register Telegram webhook with `npm run telegram:set-webhook`.

Vercel automatically provisions serverless functions for Next.js route handlers,
including `/api/telegram/webhook`. No separate bot server is required.
