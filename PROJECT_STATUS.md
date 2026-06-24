# PROJECT_STATUS

Краткая рабочая память проекта. Хранить только актуальную правду, а не полный журнал изменений.

## 1. Current State

- Updated: `2026-06-24`
- Phase: `Vercel production deployment with Telegram-first athlete journey`
- App: `/Users/satunkin/Codex_projects/rating/web`
- Stack: Next.js 16 App Router, React 19, Tailwind CSS 4, Prisma 7, PostgreSQL/Supabase.
- Brand and active season: `Кубок Циклон · 2026`.
- Public routes: `/`, `/leaderboard`, `/events`, `/events/[competitionId]`, `/clubs/[clubId]`, `/coaches/[coachId]`, `/rules`, `/participate`.
- Athlete public profiles are retired: `/athletes/[athleteId]` redirects to `/leaderboard`.
- `/cabinet` is the canonical workspace for athletes and administrators; administrator sections include competitions, athletes, moderation, clubs/trainers and broadcasts.
- Telegram webhook is implemented at `/api/telegram/webhook`; production bot token, webhook secret and public bot URL are configured in Vercel, and the webhook is registered.
- Deployment target is Vercel Hobby with Supabase; masterhost remains responsible for domain registration, DNS management and existing mail/legacy hosting.
- Additive Supabase migration `20260620120000_cyclon_competitions_telegram` is applied.
- Migration result: `13` competitions, `13` distances, `0` orphan distances, `8761` protocol rows, `130` protocol groups, `11` submissions and `10` verified results.
- Existing user changes present before this implementation were preserved.

## 2. Confirmed Decisions

- Website is the public rating and competition showcase.
- Telegram bot is the primary athlete interface for registration, profile updates, result submission, corrections and personal rating.
- Admin panel remains the source of truth for moderation and reference data.
- Rating is separate for men and women and uses the sum of three best verified results.
- Competition is a parent entity; the existing `Event` table remains the compatible physical model for a competition distance.
- Benchmark priority: imported protocol, administrator override, athlete hint awaiting verification.
- Clubs and coaches are many-to-many with athletes.
- User-proposed competitions, clubs and coaches require moderation.
- Confirmed result updates/deletions do not affect the rating until approved.
- Archive is the default destructive-action policy.
- Only season 2026 is exposed in the current UX.
- Visual design polish is a separate next phase.
- `plansporta.ru` is still served by the old Netlify site; it must not be switched until the Vercel deployment and Telegram webhook are verified.

## 3. Architecture

- `Competition` owns common event data, series and public/registration/results links.
- Legacy `Event` rows are competition distances linked through `competitionId`.
- `ProtocolGroup` stores distance-specific group metadata and fifth-place benchmark source.
- `Club`, `Coach`, `AthleteClub`, `AthleteCoach` implement public associations.
- `EntityProposal` handles proposed competitions/clubs/coaches.
- `AthleteLinkRequest` prevents automatic Telegram/profile merging.
- `TelegramConversation` stores resumable bot state.
- `TelegramUpdate` provides webhook idempotency.
- `TelegramNotification` stores moderation delivery attempts.
- Shared product logic for Telegram and new public/admin flows lives in `web/src/lib/cyclon-service.ts`.
- Protocol import continues through organizer parsers and now rebuilds `ProtocolGroup` records after import.
- Migration fallback command: `npm run db:apply:cyclon-migration`; verification: `npm run db:check:cyclon-migration`.

## 4. Implemented

- Safe additive schema and data backfill from existing events to competitions/distances.
- Public top-10 rating with two columns and one expandable athlete row per column.
- Full rating with desktop columns, mobile gender tabs, compact auto-applying search, age-group/club/coach filters, reset action and 50-item pagination.
- Expanded rows show all results, top-three status, clubs, coaches and consented Telegram username.
- Public competition index split into future/past and competition detail grouped by distance.
- Public club and coach cards for active 2026 ranking participants.
- Admin competition creation and editing support multiple distances, separate protocol URLs per distance, series and protocol-group benchmark overrides.
- Admin club/coach directory with archive/restore.
- Admin athlete archive/restore controls are available from the athletes list and the athlete detail card.
- Admin athlete creation no longer requires email, password or patronymic and can store an optional Telegram username for future linking.
- Athlete admin form supports birth date, gender, Telegram visibility, multiple clubs and multiple coaches.
- Admin login uses user-facing Russian copy and no longer exposes environment-variable names or the active authentication mode.
- Administrator pages and actions use `/cabinet/*`; legacy `/admin/*` URLs only redirect to their `/cabinet/*` replacements.
- Moderation supports create/update/delete submission types while preserving old verified results until approval.
- Moderation queue now uses compact one-row submission entries with quick approve/reject actions and expandable detailed editing per submission.
- Moderation quick approve/reject actions now give inline pending/success feedback and remove the reviewed row from the queue without a full page reload.
- Telegram bot menu, onboarding, `Имя Фамилия` profile-name parsing, safe profile-link requests including swapped name-order matches, result submission, unknown competition proposals, profile editing, personal ranking, result update/delete requests and duplicate protection.
- Moderation decisions enqueue/send Telegram notifications when a linked conversation exists.
- Deployment checks include Telegram environment and new RLS tables.
- Vercel project `sportplan-rating` builds the GitHub repository with Root Directory `web`.
- SMTP is optional for the Telegram-first deployment; without SMTP only the legacy athlete magic-link login is unavailable.
- Local lint, Prisma validation, production build and deployment-readiness check with `APP_BASE_URL=https://plansporta.ru` pass.
- Production deployment `https://sportplan-rating.vercel.app` is live; `/api/health` returns `200` with no blockers.
- Production Telegram variables are stored in Vercel; unsigned webhook requests correctly return `401`.
- Telegram webhook points to `https://sportplan-rating.vercel.app/api/telegram/webhook`; `getWebhookInfo` reports no delivery errors and an empty pending queue.
- Root `.vercelignore` prevents local `.env`, build output and local UX artifacts from entering manual CLI deployments.
- Browser smoke checks passed for homepage, accordion behavior, full-rating search, mobile tabs, events, competition detail and admin competition/directory pages.
- Homepage, full leaderboard and competitions now share the public visual language of the rules page: consistent hero panels, content width, section rhythm, filters, list surfaces and CTA treatment.

## 5. Open Gaps

- Live Telegram chat has not been tested yet.
- Telegram club/coach flow currently submits a new proposal by name; choosing an existing directory item inside the bot is not yet implemented.
- Admin proposal merging uses a target entity ID field; searchable merge UI remains future UX work.
- Telegram notifications are immediate with delivery logging; automatic retry worker is not implemented.
- Broadcasts remain a UI scaffold and are not connected to bulk Telegram delivery.
- Legacy web athlete cabinet/result routes remain for compatibility.
- Imported protocol rows are grouped and benchmarked, but automatic athlete-row matching is not yet implemented.
- Production SMTP is intentionally optional; without it only the legacy athlete magic-link login is unavailable.
- `plansporta.ru` still points to the old Netlify deployment.

## 6. Demo Snapshot

- Women: Анна Лебедева `1626`, Марина Крылова `826`.
- Men: Алексей Волков `1109`, Илья Серов `911`, Николай Сатункин `8`.
- Real imported protocols: runc.run `8493` rows; RaceResult/Grom `268` rows.

## 7. Working Rules For Future Chats

1. Read this file and root `AGENTS.md` before substantial work.
2. Preserve unrelated dirty-worktree changes.
3. Trust code and live schema over stale documentation, then update this file.
4. Use archive instead of physical deletion by default.
5. Keep website, admin and Telegram on the shared service layer.
6. Update this file after every meaningful implementation slice.

## 8. Next Steps

1. Run a real Telegram onboarding/result/moderation test.
2. Attach `plansporta.ru` and `www.plansporta.ru` to Vercel, then switch DNS after confirmation.
3. Add selectable existing clubs/coaches in Telegram and searchable duplicate merging in admin.
4. Add Telegram notification retry processing and connect broadcasts.
5. Match imported protocol rows to submissions automatically.
6. Optionally configure SMTP for legacy athlete web login.
7. Continue the separate visual design and polish phase.
8. Monitor the hourly Airtable PR workflow: each run processes all available `Todo` cards sequentially, creating one dedicated `codex/airtable-*` branch and Draft PR per card; a separate monitor marks cards `Done` only after their PRs are merged into `main`.

## 9. Decision Log

- `2026-06-20`: brand fixed as `Кубок Циклон · 2026`.
- `2026-06-20`: Telegram bot moved into the current implementation scope as the primary athlete interface.
- `2026-06-20`: Competition became a real parent model; existing Event remains the compatible distance storage.
- `2026-06-20`: public athlete profile removed in favor of expandable rating rows.
- `2026-06-20`: clubs and coaches made many-to-many and publicly linkable from rating rows.
- `2026-06-20`: archive-first deletion and moderated changes to verified results adopted.
- `2026-06-20`: additive migration applied to Supabase with no lost protocol/submission/result rows.
- `2026-06-22`: Vercel Hobby selected for the non-commercial Next.js app and Telegram webhook; Supabase remains the database and masterhost remains the domain/mail provider.
- `2026-06-22`: production Telegram webhook registered on the verified Vercel endpoint.
- `2026-06-22`: hourly Codex automation `airtable-backlog-worker` enabled for the Airtable backlog.
- `2026-06-23`: `/cabinet` became the canonical administrator workspace; legacy `/admin/*` routes were reduced to compatibility redirects.
- `2026-06-23`: Airtable delivery switched to review-first Pull Requests: the worker may push only a dedicated branch and create a Draft PR, while a separate monitor sets `Done` only after manual merge into `main`.
- `2026-06-23`: moderation backlog card `recqqbCo0cL4fHzu3` was reimplemented on current `main` as compact review rows with expandable detailed editing.
- `2026-06-24`: admin competition creation now supports multiple distances with a separate protocol URL/import per distance.
- `2026-06-24`: Telegram athlete full-name parsing now treats input as `Имя Фамилия` and can match existing active athletes with swapped first/last names before creating a new profile.
- `2026-06-24`: public leaderboard filters became compact, auto-applying URL filters with a reset action shown only when filters are active.
