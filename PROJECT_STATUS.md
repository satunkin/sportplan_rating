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

Updated: `2026-05-18`
Project phase: `MVP information architecture + protocol-import foundation`
Primary app path: `/Users/satunkin/Codex_projects/rating/web`
Git remote: `https://github.com/satunkin/sportplan_rating.git`
Current branch: `main`

Current product state:
- есть главная страница, role-based `/cabinet`, подача результата, админский вход, очередь модерации, публичный рейтинг, публичная карточка спортсмена и публичная карточка соревнования;
- `/cabinet` теперь разводит сценарии по роли: спортсмен получает настройки публичного профиля и управление своими результатами, администратор — соревнования, спортсменов, администраторов и быстрый вход в moderation queue;
- есть новый публичный раздел `/events` со списком соревнований и страницами `/events/[eventId]`;
- администратор может создавать, редактировать и удалять карточки соревнований, а также редактировать карточку спортсмена и его результаты из кабинета;
- спортсмен может менять имя для публичной карточки, включать/выключать публикацию всех результатов, редактировать прошлые результаты с повторной отправкой на подтверждение и удалить свой профиль;
- в модель результата добавлены `placementOverall` и `placementInAgeGroup`, чтобы карточки соревнований и спортсменов показывали не только время и очки, но и места;
- в модель спортсмена добавлены `publicDisplayName` и `showPublicResults` для контроля публичного профиля;
- админский login теперь пропускает не только env-admin, но и пользователей с ролью `ADMIN`, созданных из кабинета;
- есть публичная страница методологии рейтинга;
- есть athlete-facing UX pass: главная теперь показывает сам рейтинг, краткие правила, путь участника и быстрые ссылки на кабинет и полные правила;
- есть общий footer с юридическими ссылками и базовые placeholder-страницы `Пользовательское соглашение` и `Соглашение о персональных данных`;
- есть заметный UI-паттерн `TechnicalNote` для сохранения внутренних технических пояснений рядом с пользовательскими текстами;
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
- в админской moderation queue появились подсказки по ручной проверке: отсутствие protocol URL, mismatch возрастной группы с профилем, related submissions того же спортсмена и auto-fill категории/локации от existing event;
- спорные кейсы в manual moderation теперь требуют явного подтверждения и комментария модератора: отсутствие публичного протокола, merged age groups, группа меньше `5` финишеров;
- ranking recalculation теперь соответствует зафиксированному tie-break: лучший результат, затем второй, затем третий, затем число подтвержденных стартов, затем shared place;
- есть hosted deployment prep: `/api/health`, `deploy:check` и Vercel-oriented env checklist;
- `deploy:check` теперь проверяет не только env-поля, но и доступность PostgreSQL, наличие ключевых Prisma-таблиц и SMTP handshake;
- production env для `DATABASE_URL` / `DIRECT_URL` уже заведены на реальные Supabase строки;
- есть подтвержденный Supabase demo snapshot, который можно безопасно пересидировать без глобального удаления данных.
- на текущем Supabase-проекте включен RLS для основных таблиц `public`, чтобы закрыть публичный доступ, на который ругался Security Advisor.
- добавлен отдельный проектный субагент `agents/protocol-importer` с organizer-specific skills для импорта протоколов;
- зафиксирован единый контракт данных для нормализованного протокола и request-файла импорта;
- добавлен CLI-импортёр `npm run db:import:protocol`, который умеет прогонять `dry-run` и записывать строки протокола в `Event` + `EventProtocolRow`;
- в проект уже положены реальные raw + normalized артефакты для двух организаторов:
  - `runc.run`: полный протокол `15 км` на `8493` строки;
  - `grom.place` / `RaceResult`: `xlsx` + `pdf` и нормализованный протокол `Спринт` на `268` строк;
- оба request-файла уже проходят через `dry-run` импортёр без ручной правки.
- оба протокола уже записаны в PostgreSQL:
  - `Grom Tri Sprint - III этап` (`268` protocol rows);
  - `The Garden Ring Relay Race` 15 km (`8493` protocol rows);
- create/update карточки соревнования теперь умеют auto-import protocol rows при сохранении поддержанной ссылки `runc.run` или `RaceResult`;
- parser layer больше не завязан на две точные ссылки: появился organizer-level live import для `runc.run` и `RaceResult` (`my.raceresult.com` / related hosts), который скачивает источник по URL, нормализует строки и пишет их в `EventProtocolRow`.

Current limitation:
- это еще не production-ready MVP;
- авторизация стала безопаснее на уровне cookie/session, athlete magic link и admin credentials, но Telegram auth пока не подключен, а SMTP для production сознательно отложен на более поздний этап;
- импорт протоколов пока не встроен в UI и не запускается автоматически из карточки соревнования;
- импорт протоколов пока file-based и CLI-first: до UI в кабинете ещё не доведён;
- `runc.run` и `grom.place` уже имеют рабочие артефакты, но новые организаторы пока нужно добавлять вручную через отдельный skill;
- auto-import из кабинета уже работает через live parser для `runc.run` и `RaceResult`, но остальные организаторы по-прежнему не поддержаны;
- создание администраторов уже переведено в UI, но полноценный audit trail still uses the legacy fallback admin actor inside moderation actions;
- runtime уже живет на Postgres-first path, но production env layout (`DATABASE_URL`, `DIRECT_URL`, SMTP, public URL) еще не доведен до финального deploy shape;
- hosted deploy пока блокируется как минимум отсутствием production SMTP setup и публичного `APP_BASE_URL`; кроме того, локальная reachability Supabase может зависеть от среды выполнения;
- нет production deployment path для размещенного сайта;
- нет рабочего Telegram-бота для участников.
- часть экранов уже переписана на язык атлета, но remaining copy pass и backend-выравнивание под новый UX еще впереди.

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
- Для публичной карточки спортсмена имя и полная история результатов контролируются самим спортсменом через настройки профиля.

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
- protocol import bridge: `normalized JSON -> request JSON -> CLI importer -> Event/EventProtocolRow`

Current key files:
- PRD: [docs/PRD.md](/Users/satunkin/Codex_projects/rating/docs/PRD.md)
- Implementation plan: [docs/IMPLEMENTATION_PLAN.md](/Users/satunkin/Codex_projects/rating/docs/IMPLEMENTATION_PLAN.md)
- Main routes: [web/src/app/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/page.tsx), [web/src/app/cabinet/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/cabinet/page.tsx), [web/src/app/leaderboard/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/leaderboard/page.tsx), [web/src/app/events/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/events/page.tsx), [web/src/app/rules/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/rules/page.tsx)
- Admin detail routes: [web/src/app/cabinet/athletes/[athleteId]/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/cabinet/athletes/[athleteId]/page.tsx), [web/src/app/cabinet/events/[eventId]/edit/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/cabinet/events/[eventId]/edit/page.tsx)
- Athlete edit route: [web/src/app/results/[submissionId]/edit/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/results/[submissionId]/edit/page.tsx)
- Shared UX blocks: [web/src/app/site-header.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/site-header.tsx), [web/src/app/site-footer.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/site-footer.tsx), [web/src/components/technical-note.tsx](/Users/satunkin/Codex_projects/rating/web/src/components/technical-note.tsx)
- Main DB logic: [web/src/lib/db.ts](/Users/satunkin/Codex_projects/rating/web/src/lib/db.ts)
- Protocol import agent: [agents/protocol-importer/AGENT.md](/Users/satunkin/Codex_projects/rating/agents/protocol-importer/AGENT.md)
- Protocol import contracts: [agents/protocol-importer/contracts/normalized-event-protocol.schema.json](/Users/satunkin/Codex_projects/rating/agents/protocol-importer/contracts/normalized-event-protocol.schema.json), [agents/protocol-importer/contracts/protocol-import-request.schema.json](/Users/satunkin/Codex_projects/rating/agents/protocol-importer/contracts/protocol-import-request.schema.json)
- Protocol import scripts: [web/scripts/import-event-protocol.mjs](/Users/satunkin/Codex_projects/rating/web/scripts/import-event-protocol.mjs), [web/scripts/lib/protocol-import.mjs](/Users/satunkin/Codex_projects/rating/web/scripts/lib/protocol-import.mjs)
- DB bootstrap: [web/src/lib/db-bootstrap.ts](/Users/satunkin/Codex_projects/rating/web/src/lib/db-bootstrap.ts)
- Scoring rules: [web/src/lib/scoring.ts](/Users/satunkin/Codex_projects/rating/web/src/lib/scoring.ts)
- Demo seed: [web/scripts/seed-demo.mjs](/Users/satunkin/Codex_projects/rating/web/scripts/seed-demo.mjs)

Key routes implemented:
- `/`
- `/register`
- `/cabinet`
- `/cabinet/athletes/[athleteId]`
- `/cabinet/events/[eventId]/edit`
- `/results/new`
- `/results/[submissionId]/edit`
- `/admin/login`
- `/admin/submissions`
- `/events`
- `/events/[eventId]`
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
- athlete-facing homepage with leaderboard preview, quick rules, and action-oriented navigation;
- athlete registration foundation;
- athlete login by email and password;
- athlete login by email magic link;
- athlete cabinet foundation;
- role-based cabinet with separate admin/athlete information architecture;
- result submission flow;
- athlete result edit / resubmission flow;
- athlete public-profile settings (`publicDisplayName`, `showPublicResults`);
- admin login with env-based credentials and dev fallback;
- admin login with DB-backed `ADMIN` users created from the cabinet;
- manual moderation queue;
- approval/rejection flow;
- moderation helpers for protocol-aware manual review;
- explicit moderator confirmation flow for ambiguous manual-review cases;
- score rules seed;
- verified results creation;
- ranking recalculation;
- ranking tie-break logic with shared-place handling;
- public leaderboard;
- public events index and public event card with registered participants;
- footer-level legal navigation with placeholder legal pages;
- public athlete page;
- admin event management;
- admin athlete management;
- admin-side user creation for athletes and admins;
- demo data generation;
- duplicate submission protection for exact repeated results;
- Next.js 16-safe magic link verification flow through route handler.
- minimal event reuse and event location capture in admin moderation.
- reusable highlighted technical-note pattern for mixed product/dev copy.
- protocol-import subagent with organizer-specific skills for `runc.run` and `grom.place`;
- normalized protocol and import-request contracts for future organizers;
- CLI protocol import path with `dry-run` validation and DB write mode for `EventProtocolRow`;
- full `runc.run` protocol fixture assembled from 9 HTML pages for `The Garden Ring Relay Race` 15 km;
- `grom.place` / `RaceResult` XLSX/PDF source links resolved and normalized sprint protocol assembled from the XLSX export.
- admin event create/update flow now calls a known-protocol importer after saving `sourceUrl`, so supported organizers populate `EventProtocolRow` automatically.
- admin event create/update flow now calls a live organizer parser layer; для `runc.run` парсятся все страницы выдачи, для `RaceResult` тянется config + XLSX export.

Implemented developer validation:
- `npm run lint` passes after recent working cycles;
- `npm run build` passes after recent working cycles;
- `npm run db:smoke:postgres` validates the runtime PostgreSQL path, but in some local/sandbox environments may fail if the current runtime cannot reach Supabase over the network;
- `npm run db:seed:demo` is rerunnable and produces a valid demo ranking snapshot on Supabase.
- `npm run deploy:check` теперь задуман как реальный pre-deploy smoke check для env + DB + SMTP readiness.

---

## 5. Open Gaps

Still not done from the original project intent:
- production-hardening of participant auth (`SMTP`, email verification polish, password reset, optional Telegram link);
- hosted deployment path for the website;
- no UI for protocol import inside admin cabinet yet;
- first-class protocol rows editing/import UI for `EventProtocolRow`;
- semi-automatic or automatic result validation;
- management UI for seasons, score rules, event categories;
- appeals/dispute flow;
- notifications;
- working Telegram bot for participants;
- public filters beyond current basic leaderboard filters;
- protection against duplicates and moderation edge cases.
- final legal copy for user agreement and personal-data policy.

Current technical debt:
- Postgres runtime уже основной, но env-конвенция еще transitional: часть команд умеет fallback на `DATABASE_URL_POSTGRES`, а production-shaped `DATABASE_URL` / `DIRECT_URL` еще не закреплены как единственная схема;
- Prisma CLI path зависит от reachability `DIRECT_URL`; для Supabase direct host в некоторых локальных средах может понадобиться `session pooler :5432` вместо IPv6-only direct host;
- participant auth уже перешел на magic link baseline, но в production ему все еще нужен реальный SMTP, а admin auth still lacks proper RBAC / audit attribution / 2FA;
- deploy-ready path частично упирается в среду: even with real Supabase envs local smoke checks могут падать, если текущий runtime не достукивается до хоста БД;
- RLS на таблицах уже включен, но policies под будущие прямые client-side сценарии пока не проектировались: текущая модель предполагает server-side доступ через Prisma;
- organizer import layer пока ручной и file-based: новые организаторы нужно добавлять отдельными skills и fixture/request шаблонами;
- importer пока не различает финишеров и статусные строки на уровне отдельного enum: `DNF` / `DSQ` / `DQ` сохраняются как raw status fields в normalized artifacts и частично приходят в importer как строки без парсимого времени;
- organizer-level resolver уже есть для `runc.run` и `RaceResult`, но:
  - `RaceResult` пока опирается на XLSX link из `InfoText` config-а;
  - итоговый matching imported protocol rows к athlete submissions ещё не автоматизирован;
- часть UI-текстов уже адаптирована под новую структуру, но remaining copy pass и deeper backend-normalization still remain.

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
2. finish production email setup for magic-link auth (`SMTP`, `APP_BASE_URL`, end-to-end email check) after current product-critical coding slices;
3. keep registration, cabinet, result submission, moderation queue, and leaderboard fully working on hosted production DB;
4. continue extending manual moderation toward protocol-aware helpers and connect the new protocol-import foundation to real admin workflows;
5. continue closing remaining ranking correctness gaps beyond exact duplicates and tie-break;
6. run end-to-end launch validation on hosted environment.
7. after the current UX pass, align backend statuses and remaining copy with the updated athlete-facing screen structure.

P1 — important after P0, before broader growth:
1. укрепить live parser layer для `runc.run` и `RaceResult` на большем числе реальных стартов и добавить новых организаторов;
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
- довести новый management layer до operational completeness:
  - перевести moderation review actor с legacy admin fallback на реального admin session user;
  - связать уже загруженные `EventProtocolRow` с moderation / matching flow;
  - добавить UI-обратную связь в кабинете о результате автоимпорта протокола и количестве загруженных строк;
  - затем вернуться к hosted deploy validation once `APP_BASE_URL` and SMTP are ready.

---

## 9. Decision Log

- `2026-05-12`: PRD converted into implementation-ready docs package.
- `2026-05-18`: `/cabinet` fixed as the single role-based entrypoint; public athlete visibility moved under athlete-controlled profile settings; event cards became first-class public pages.
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
- `2026-05-15`: athlete-facing UX pass completed for homepage, navigation, rules, leaderboard, and legal/footer structure.
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
- `2026-05-18`: protocol import moved from a vague backlog item to a concrete project layer: a dedicated `protocol-importer` subagent, per-organizer skills, JSON contracts, and a dry-run/apply CLI path for `EventProtocolRow` were added.
- `2026-05-18`: real organizer data landed in the project: RaceResult XLSX/PDF links were resolved for `grom.place`, and the full 9-page `runc.run` protocol was assembled into normalized import fixtures.
- `2026-05-18`: both prepared protocols were written to PostgreSQL, and admin event save now auto-imports supported protocol URLs into `EventProtocolRow`.
- `2026-05-18`: exact-fixture matching was replaced with live organizer parsers for `runc.run` and `RaceResult`, plus a URL-based import CLI for direct validation.
- `2026-05-20`: Supabase Security Advisor issue `rls_disabled_in_public` closed by enabling RLS on the public application tables through a dedicated PostgreSQL migration.
- `2026-05-13`: exact duplicate result submissions are blocked both at athlete submit time and at admin approve time.
- `2026-05-13`: athlete magic-link verification moved from server-component render to route handler because Next.js 16 forbids cookie mutation during page render.
- `2026-05-13`: admin moderation now reuses existing event entities by event fingerprint instead of blindly creating a new Event on every approve.
- `2026-05-13`: `deploy:check` strengthened from env-only validation to a real pre-deploy smoke check covering PostgreSQL connectivity, required Prisma tables, and SMTP handshake.
- `2026-05-13`: admin moderation queue gained protocol-aware helper warnings and defaults for manual review.
- `2026-05-13`: season ranking recalculation aligned with the fixed tie-break policy and shared-place behavior.
- `2026-05-14`: ambiguous manual-review approvals now require explicit moderator confirmation flags and a written reason.
