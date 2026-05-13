## Cyclon Rating Web

Current local runtime:
- `Next.js app router`
- `Prisma client`
- local / hosted DB: `PostgreSQL`
- schema management: `Prisma migrations`

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

Optional demo data:

```bash
npm run db:seed:demo
```

The demo seed is safe to rerun. It upserts the demo athletes, events, submissions, verified results, and recalculated rankings instead of wiping the whole database.

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
```

What these PostgreSQL commands do:
- validate that the canonical Prisma datamodel is PostgreSQL-compatible;
- generate `prisma/postgres/baseline.sql` as an initial SQL snapshot from the canonical schema;
- run a minimal PostgreSQL runtime smoke check with `@prisma/adapter-pg`;
- seed or refresh the demo snapshot in a non-destructive way.

Current limitation:
- production email delivery still requires a real SMTP provider;
- hosted deploy still needs final production env values and a full browser-level smoke test;
- demo seed is idempotent for the current fixture set, but it does not intentionally remove obsolete demo rows if the fixture list changes later.

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

## Next Infra Goal

Finish the hosted production path around the new PostgreSQL runtime: SMTP, deploy envs, and end-to-end checks.

## Hosted Deployment

Recommended default:
- `Vercel` for the Next.js app
- `PostgreSQL` for the hosted database
- any SMTP provider for magic-link delivery

Before the first hosted deploy:

```bash
npm run deploy:check
```

What must be ready for a real hosted environment:
- `DATABASE_URL` must point to PostgreSQL
- `DIRECT_URL` should point to a direct PostgreSQL connection for Prisma CLI
- `APP_BASE_URL` must point to the public website URL
- `SESSION_SECRET` must be set
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM` must be configured
- `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` should be configured

Health endpoint:

```text
/api/health
```

It returns:
- `200` when the current runtime looks deployment-ready
- `503` when blockers still exist, with a JSON list of blockers and warnings

Practical Vercel path:
1. Create a PostgreSQL database.
2. Put its connection string into `DATABASE_URL`.
3. Configure SMTP and `APP_BASE_URL`.
4. Add all env vars in the Vercel project settings.
5. Run `npm run deploy:check` locally with those envs.
6. Deploy the `web` app to Vercel.
7. Open `/api/health` on the deployed URL and confirm `status: "ok"`.
