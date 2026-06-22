# PROJECT_STATUS

Краткая рабочая память проекта. Хранить только актуальную правду, а не полный журнал изменений.

## 1. Current State

- Updated: `2026-06-22`
- Phase: `Netlify production preparation with Telegram-first athlete journey`
- App: `/Users/satunkin/Codex_projects/rating/web`
- Stack: Next.js 16 App Router, React 19, Tailwind CSS 4, Prisma 7, PostgreSQL/Supabase.
- Brand and active season: `Кубок Циклон · 2026`.
- Public routes: `/`, `/leaderboard`, `/events`, `/events/[competitionId]`, `/clubs/[clubId]`, `/coaches/[coachId]`, `/rules`, `/participate`.
- Athlete public profiles are retired: `/athletes/[athleteId]` redirects to `/leaderboard`.
- Admin routes include dashboard, competitions, athletes, moderation, clubs/trainers and broadcasts.
- Telegram webhook is implemented at `/api/telegram/webhook`; production bot token, webhook secret, public bot URL and webhook registration are still required.
- Deployment target is Netlify Free with Supabase; masterhost remains responsible for domain registration, DNS management and existing mail/legacy hosting.
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
- `plansporta.ru` is currently served by the existing Netlify site; production DNS must not be changed until the new deploy preview passes.

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
- Full rating with desktop columns, mobile gender tabs, search, age-group/club/coach filters and 50-item pagination.
- Expanded rows show all results, top-three status, clubs, coaches and consented Telegram username.
- Public competition index split into future/past and competition detail grouped by distance.
- Public club and coach cards for active 2026 ranking participants.
- Admin competition creation/editing with multiple distances, separate URLs, series and protocol-group benchmark overrides.
- Admin club/coach directory with archive/restore.
- Athlete admin form supports birth date, gender, Telegram visibility, multiple clubs and multiple coaches.
- Moderation supports create/update/delete submission types while preserving old verified results until approval.
- Telegram bot menu, onboarding, safe profile-link requests, result submission, unknown competition proposals, profile editing, personal ranking, result update/delete requests and duplicate protection.
- Moderation decisions enqueue/send Telegram notifications when a linked conversation exists.
- Deployment checks include Telegram environment and new RLS tables.
- Root `netlify.toml` configures the `web` base directory, Node.js 20 and the standard Netlify Next.js adapter path.
- SMTP is optional for the Telegram-first deployment; without SMTP only the legacy athlete magic-link login is unavailable.
- Local lint, Prisma validation, production build and deployment-readiness check with `APP_BASE_URL=https://plansporta.ru` pass.
- Browser smoke checks passed for homepage, accordion behavior, full-rating search, mobile tabs, events, competition detail and admin competition/directory pages.

## 5. Open Gaps

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` and `NEXT_PUBLIC_TELEGRAM_BOT_URL` are not configured in the checked-in environment template.
- Production webhook has not been registered; run `npm run telegram:set-webhook` after public deployment.
- Live Telegram chat was not tested because no bot token was available.
- Telegram club/coach flow currently submits a new proposal by name; choosing an existing directory item inside the bot is not yet implemented.
- Admin proposal merging uses a target entity ID field; searchable merge UI remains future UX work.
- Telegram notifications are immediate with delivery logging; automatic retry worker is not implemented.
- Broadcasts remain a UI scaffold and are not connected to bulk Telegram delivery.
- Legacy web athlete cabinet/result routes remain for compatibility.
- Imported protocol rows are grouped and benchmarked, but automatic athlete-row matching is not yet implemented.
- Production SMTP and hosted deployment remain incomplete.
- Netlify project settings and production environment variables still need to be configured manually because automated dashboard inspection is unavailable.

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

1. Configure the existing Netlify project to build the GitHub repository using root `netlify.toml`.
2. Add production environment variables and verify a deploy preview.
3. Register the webhook and run a real Telegram onboarding/result/moderation test.
4. Add selectable existing clubs/coaches in Telegram and searchable duplicate merging in admin.
5. Add Telegram notification retry processing and connect broadcasts.
6. Match imported protocol rows to submissions automatically.
7. Optionally configure SMTP for legacy athlete web login.
8. Run the separate visual design and polish phase.

## 9. Decision Log

- `2026-06-20`: brand fixed as `Кубок Циклон · 2026`.
- `2026-06-20`: Telegram bot moved into the current implementation scope as the primary athlete interface.
- `2026-06-20`: Competition became a real parent model; existing Event remains the compatible distance storage.
- `2026-06-20`: public athlete profile removed in favor of expandable rating rows.
- `2026-06-20`: clubs and coaches made many-to-many and publicly linkable from rating rows.
- `2026-06-20`: archive-first deletion and moderated changes to verified results adopted.
- `2026-06-20`: additive migration applied to Supabase with no lost protocol/submission/result rows.
- `2026-06-22`: Netlify Free selected for Next.js and Telegram webhook; Supabase remains the database and masterhost remains the domain/mail provider.
