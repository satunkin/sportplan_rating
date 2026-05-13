# PROJECT_STATUS

Этот файл — краткая рабочая память проекта.
Его задача:
- хранить только актуальный статус;
- фиксировать важные принятые решения;
- уменьшать повторный сбор контекста в новых чатах;
- служить первым файлом для чтения перед продолжением работы.

Правило обновления:
- секции `Current State`, `Confirmed Decisions`, `Architecture`, `Open Gaps`, `Next Steps` нужно переписывать целиком по мере изменений;
- секцию `Decision Log` можно дополнять короткими новыми строками;
- не превращать файл в длинный дневник;
- держать его компактным и фактологичным.

---

## 1. Current State

Updated: `2026-05-13`
Project phase: `MVP foundation + demo flow`
Primary app path: `/Users/satunkin/Codex_projects/rating/web`
Git remote: `https://github.com/satunkin/sportplan_rating.git`
Current branch: `main`

Current product state:
- есть главная страница, кабинет, подача результата, админский вход, очередь модерации, публичный рейтинг, публичная карточка спортсмена;
- есть публичная страница методологии рейтинга;
- есть UI-объяснение расчета очков внутри leaderboard, кабинета и публичной карточки спортсмена;
- есть demo seed для наполнения тестовыми участниками и рейтингом;
- есть scoring foundation: категории, базовые очки, расчет lag percent, начисление очков, top-3 ranking logic;
- есть signed cookie sessions для athlete/admin и logout flow;
- есть athlete auth baseline через регистрацию в БД, primary `email magic link` login и временный password fallback;
- athlete magic link verification переведен с page-render path на route handler, чтобы cookie-сессия ставилась корректно в Next.js 16;
- есть strengthened admin auth baseline через `ADMIN_EMAIL + ADMIN_PASSWORD_HASH` с временным fallback на `ADMIN_ACCESS_KEY`;
- runtime DB access теперь централизован вокруг `DATABASE_URL` / `DATABASE_URL_POSTGRES`, а `SESSION_SECRET` выделен как env-конфиг для production auth baseline;
- есть baseline Prisma migration history; runtime больше не создает таблицы вручную SQL bootstrap-скриптом;
- canonical Prisma schema уже переведена на `postgresql`, runtime использует `@prisma/adapter-pg`, а Supabase подтверждена как рабочая БД для следующего этапа MVP;
- есть baseline SQL / validate / smoke-check path для Postgres и безопасный idempotent demo seed для удаленной БД;
- есть duplicate guard для точных повторов одного и того же результата: повторная подача блокируется у спортсмена, а duplicate approve в админке останавливается с явным предупреждением;
- есть минимальный event-management inside moderation: approve flow переиспользует существующий `Event` по ключу старта и позволяет сохранить/обновить локацию события;
- есть hosted deployment prep: `/api/health`, `deploy:check` и Vercel-oriented env checklist;
- есть подтвержденный Supabase demo snapshot, который можно безопасно пересидировать без глобального удаления данных.

Current limitation:
- это еще не production-ready MVP;
- авторизация стала безопаснее на уровне cookie/session, athlete magic link и admin credentials, но Telegram auth пока не подключен, а SMTP для production еще не настроен;
- протоколы соревнований не импортируются автоматически;
- runtime уже живет на Postgres-first path, но production env layout (`DATABASE_URL`, `DIRECT_URL`, SMTP, public URL) еще не доведен до финального deploy shape;
- hosted deploy пока блокируется отсутствием production env setup: PostgreSQL `DATABASE_URL`, SMTP, `APP_BASE_URL`, `SESSION_SECRET`, и production admin credentials.
- нет production deployment path для размещенного сайта;
- нет рабочего Telegram-бота для участников.

---

## 2. Confirmed Decisions

- Главный канал продукта: `website`.
- Telegram пока не является основным интерфейсом MVP.
- Для dev-режима допустим временный локальный persistence-layer, если он ускоряет реальную проверку UX.
- Рейтинг считается по сумме `3 лучших` подтвержденных результатов.
- Очки зависят от:
  - категории дистанции;
  - отставания от `5-го места` в возрастной группе.
- Для MVP формула очков фиксируется как `round(basePoints * exp(-0.077 * lagPercent))`.
- Если спортсмен быстрее `5-го места`, то `lagPercent = 0`, а максимум за старт равен `basePoints`.
- Случаи с группой менее `5` финишеров, `merged age groups` и отсутствием публичного протокола не автозасчитываются и идут в ручную модерацию.
- `DNS`, `DNF`, `DSQ` не участвуют в рейтинге.
- Tie-break в рейтинге: лучший результат, затем второй, затем третий, затем число подтвержденных зачетных результатов, затем shared place.
- Для текущего dev/demo flow дата старта в форме результата вводится в рамках `текущего сезона`.
- Файл `PROJECT_STATUS.md` является основной межчатовой памятью проекта.

---

## 3. Architecture

Frontend / app shell:
- `Next.js app router`
- `Tailwind CSS`

Data / backend:
- `Prisma client`
- primary persistence: `PostgreSQL`
- runtime DB access: `DATABASE_URL + DATABASE_URL_POSTGRES + PrismaPg adapter`
- migrations / schema truth: canonical `web/prisma/schema.prisma` with `postgresql` provider

Current key files:
- PRD: [docs/PRD.md](/Users/satunkin/Codex_projects/rating/docs/PRD.md)
- Implementation plan: [docs/IMPLEMENTATION_PLAN.md](/Users/satunkin/Codex_projects/rating/docs/IMPLEMENTATION_PLAN.md)
- Main DB logic: [web/src/lib/db.ts](/Users/satunkin/Codex_projects/rating/web/src/lib/db.ts)
- DB bootstrap: [web/src/lib/db-bootstrap.ts](/Users/satunkin/Codex_projects/rating/web/src/lib/db-bootstrap.ts)
- Scoring rules: [web/src/lib/scoring.ts](/Users/satunkin/Codex_projects/rating/web/src/lib/scoring.ts)
- Demo seed: [web/scripts/seed-demo.mjs](/Users/satunkin/Codex_projects/rating/web/scripts/seed-demo.mjs)

Key routes implemented:
- `/`
- `/register`
- `/cabinet`
- `/results/new`
- `/admin/login`
- `/admin/submissions`
- `/leaderboard`
- `/rules`
- `/athletes/[athleteId]`

---

## 4. Implemented

Implemented product slices:
- project bootstrap;
- git initialization and GitHub remote setup;
- PRD and implementation docs;
- public homepage;
- athlete registration foundation;
- athlete login by email and password;
- athlete login by email magic link;
- athlete cabinet foundation;
- result submission flow;
- admin login with env-based credentials and dev fallback;
- manual moderation queue;
- approval/rejection flow;
- score rules seed;
- verified results creation;
- ranking recalculation;
- public leaderboard;
- public athlete page;
- demo data generation;
- duplicate submission protection for exact repeated results;
- Next.js 16-safe magic link verification flow through route handler.
- minimal event reuse and event location capture in admin moderation.

Implemented developer validation:
- `npm run lint` passes after recent working cycles;
- `npm run build` passes after recent working cycles;
- `npm run db:smoke:postgres` reaches the configured Supabase database successfully;
- `npm run db:seed:demo` is rerunnable and produces a valid demo ranking snapshot on Supabase.

---

## 5. Open Gaps

Still not done from the original project intent:
- production-hardening of participant auth (`SMTP`, email verification polish, password reset, optional Telegram link);
- hosted deployment path for the website;
- event/protocol import flow;
- semi-automatic or automatic result validation;
- management UI for seasons, score rules, event categories;
- appeals/dispute flow;
- notifications;
- working Telegram bot for participants;
- public filters beyond current basic leaderboard filters;
- protection against duplicates and moderation edge cases.

Current technical debt:
- Postgres runtime уже основной, но env-конвенция еще transitional: часть команд умеет fallback на `DATABASE_URL_POSTGRES`, а production-shaped `DATABASE_URL` / `DIRECT_URL` еще не закреплены как единственная схема;
- Prisma CLI path зависит от reachability `DIRECT_URL`; для Supabase direct host в некоторых локальных средах может понадобиться `session pooler :5432` вместо IPv6-only direct host;
- participant auth уже перешел на magic link baseline, но в production ему все еще нужен реальный SMTP, а admin auth все еще env-based и без RBAC/2FA;
- some UI texts still reflect foundation wording and need polishing during product pass.

---

## 6. Demo Snapshot

Last confirmed demo ranking snapshot:
1. Анна Лебедева — `1626`
2. Алексей Волков — `1109`
3. Илья Серов — `911`
4. Марина Крылова — `826`

How to reproduce:
```bash
cd /Users/satunkin/Codex_projects/rating/web
npm run db:seed:demo
npm run dev
```

Admin demo access:
- route: `/admin/login`
- preferred envs: `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`
- fallback env for local/dev only: `ADMIN_ACCESS_KEY`

---

## 7. Working Rules For Future Chats

When starting work in a new chat:
1. Read `PROJECT_STATUS.md`.
2. Read `docs/PRD.md` only if product scope matters.
3. Read `docs/IMPLEMENTATION_PLAN.md` only if planning or decomposition matters.
4. Inspect current `git status`.
5. Continue from `Next Steps` unless the user explicitly reprioritizes.

When updating this file:
- keep only the current truth;
- remove stale statements instead of keeping both old and new;
- prefer bullets over prose;
- record only decisions that change future implementation.

---

## 8. Next Steps

Launch checklist for MVP, aligned with PRD and current launch scope:

P0 — mandatory before launch:
1. define and test hosted deployment path for the website on the now-active PostgreSQL runtime;
2. finish production email setup for magic-link auth (`SMTP`, `APP_BASE_URL`, end-to-end email check);
3. keep registration, cabinet, result submission, moderation queue, and leaderboard fully working on hosted production DB;
4. extend the new event-management baseline into protocol-aware moderation helpers;
5. continue closing remaining ranking correctness gaps beyond exact duplicates;
6. run end-to-end launch validation on hosted environment.

P1 — important after P0, before broader growth:
1. add semi-automatic protocol validation helpers;
2. add notifications around moderation decisions;
3. align remaining ranking engine behavior with fixed tie-break and rules model;
4. expand public filters and management UI for score rules / event categories.

P2 — after core web MVP, before UX polish:
1. build working Telegram bot for participants;
2. connect Telegram bot to account / notification / lightweight submission flows.

P3 — after launch foundation:
1. finish UI polish requested in browser comments;
2. continue non-critical UX improvements;
3. add richer public experience and secondary product polish.

Current best next coding step:
- provision the real deployment inputs and then finish the infra branch:
  - move the now-working Supabase string into the final `DATABASE_URL` / `DIRECT_URL` layout;
  - configure SMTP and `APP_BASE_URL` for magic-link auth;
  - set `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH`;
  - then rerun `npm run deploy:check` and continue toward hosted deploy / browser-level validation.

---

## 9. Decision Log

- `2026-05-12`: PRD converted into implementation-ready docs package.
- `2026-05-12`: local git initialized and GitHub remote connected.
- `2026-05-12`: Next.js foundation created.
- `2026-05-12`: Prisma introduced as intended data layer.
- `2026-05-12`: dev persistence temporarily adapted for local progress.
- `2026-05-13`: scoring and leaderboard foundation implemented.
- `2026-05-13`: public athlete page and leaderboard filters added.
- `2026-05-13`: `PROJECT_STATUS.md` introduced as cross-chat project memory.
- `2026-05-13`: MVP rating methodology and tie-break policy fixed in PRD draft.
- `2026-05-13`: public rating methodology page added and linked from main navigation.
- `2026-05-13`: score breakdown UI added to leaderboard, cabinet, and athlete pages.
- `2026-05-13`: signed cookie sessions, logout flow, and env-driven SQLite runtime config added.
- `2026-05-13`: baseline Prisma migration added; runtime SQL table bootstrap removed in favor of migration/state checks.
- `2026-05-13`: PostgreSQL preparation workflow added with generated schema and baseline SQL artifacts.
- `2026-05-13`: launch checklist reprioritized around hosted web MVP, production DB, auth, admin flow, and Telegram after core launch blockers.
- `2026-05-13`: admin auth strengthened from single access key toward `ADMIN_EMAIL + ADMIN_PASSWORD_HASH`, with local/dev fallback and hash generation script.
- `2026-05-13`: athlete auth moved from session-only behavior to DB-backed email+password login baseline with a dedicated `/login` route.
- `2026-05-13`: athlete login shifted to email magic link as the primary web auth path, with DB-backed one-time tokens and dev preview when SMTP is absent.
- `2026-05-13`: hosted deployment prep added with `/api/health`, `deploy:check`, and explicit Vercel/PostgreSQL/SMTP requirements.
- `2026-05-13`: runtime DB wiring isolated behind `DATABASE_URL` and a single adapter-selection layer; next DB cutover blocker is canonical Prisma provider and migrations.
- `2026-05-13`: official `@prisma/adapter-pg`, generated postgres client, and runtime smoke-check script added; current blocker is reachable PostgreSQL server, not code compilation.
- `2026-05-13`: canonical Prisma schema, runtime client path, and Supabase validation flow switched to PostgreSQL-first operation.
- `2026-05-13`: demo seed changed from global destructive reset to idempotent Postgres-safe upsert behavior for remote environments.
- `2026-05-13`: exact duplicate result submissions are blocked both at athlete submit time and at admin approve time.
- `2026-05-13`: athlete magic-link verification moved from server-component render to route handler because Next.js 16 forbids cookie mutation during page render.
- `2026-05-13`: admin moderation now reuses existing event entities by event fingerprint instead of blindly creating a new Event on every approve.
