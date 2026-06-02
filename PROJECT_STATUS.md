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

Updated: `2026-05-30`
Project phase: `UX redesign foundation + admin information architecture`
Primary app path: `/Users/satunkin/Codex_projects/rating/web`
Git remote: `https://github.com/satunkin/sportplan_rating.git`
Current branch: `main`

Current product state:
- публичный сайт переведен на новую UX-структуру: отдельные страницы `/`, `/leaderboard`, `/events`, `/events/[eventId]`, `/athletes/[athleteId]`, `/rules`, `/participate`;
- главная теперь начинается с рейтинга сезона: две компактные колонки топ-10 мужчин и женщин, строки ведут в публичные карточки спортсменов;
- публичный рейтинг очищен от технического `ScoreBreakdown`: показывает место, спортсмена, очки, три лучших результата и понятный статус `зачет/резерв`;
- рейтинг теперь считается, сохраняется и показывается отдельно для мужчин и женщин; общего зачета в публичном UX больше нет;
- `listLeaderboard({ gender })` перенумеровывает позиции внутри выбранного пола, поэтому мужской и женский зачет оба начинаются с `1` даже до следующего пересчета БД;
- `/leaderboard` показывает только переключатель `Мужчины` / `Женщины`; фильтр `Пол` убран, дефолтный зачет — мужской;
- публичные карточки спортсмена и соревнования стали более компактными data-страницами без developer-oriented пояснений;
- публичный список соревнований группирует старты с одинаковыми названием/датой/дисциплиной/локацией как одно соревнование с несколькими дистанциями;
- для будущих соревнований публичный UX не показывает протокол и участников рейтинга; эти данные появляются только для прошедших стартов;
- в `/events` добавлен фильтр по типу соревнования (`Discipline`);
- публичный путь спортсмена теперь описан как Telegram-first: `/participate` объясняет регистрацию, отправку результатов, проверку админом и публикацию на сайте;
- шапка и подвал больше не ведут пользователя в веб-кабинет спортсмена как основной сценарий; футер содержит отдельную ссылку `Администратору`;
- админский вход `/admin/login` теперь ведет в новый dashboard `/admin`;
- добавлены новые рабочие админ-разделы: `/admin`, `/admin/events`, `/admin/athletes`, `/admin/broadcasts`;
- `/admin/events` показывает соревнования, статус протокола и создает карточки стартов; сохранение поддержанных ссылок по-прежнему запускает импорт протокола;
- `/admin/athletes` показывает список участников, поиск и форму ручного создания спортсмена;
- `/admin/broadcasts` содержит UX-заготовку рассылок с фильтрами, preview и счетчиками, но фактическая отправка ждет Telegram-бота;
- старые `/cabinet`-маршруты пока физически остаются как совместимость для уже реализованных athlete/admin flows, но не являются целевой публичной UX-навигацией;
- форма подачи результата по вебу пока сохранена технически, но целевой спортсменский путь перенесен в будущий Telegram-бот;
- в данные соревнований добавлен публично используемый счетчик `protocolRowsCount` для статуса импортированного протокола;
- форма подачи результата теперь выбирает соревнование из существующих `Event`, умеет переключиться на ручной ввод, подставляет дату/дисциплину/дистанцию/протокол, использует календарную дату с годом и подсвечивает ошибки без сброса введенных данных;
- в модель результата добавлены `placementOverall` и `placementInAgeGroup`, чтобы карточки соревнований и спортсменов показывали не только время и очки, но и места;
- в модель спортсмена добавлены `publicDisplayName` и `showPublicResults` для контроля публичного профиля;
- админский login теперь пропускает не только env-admin, но и пользователей с ролью `ADMIN`, созданных из кабинета;
- есть публичная страница методологии рейтинга;
- визуальная система начала переход к `DESIGN.md`: белые поверхности, строгая серо-черная типографика, один синий CTA, меньше радиусов/теней/декора на новых публичных и админских страницах;
- есть общий footer с юридическими ссылками и базовые placeholder-страницы `Пользовательское соглашение` и `Соглашение о персональных данных`;
- есть заметный UI-паттерн `TechnicalNote` для сохранения внутренних технических пояснений рядом с пользовательскими текстами;
- есть UI-объяснение расчета очков внутри leaderboard, кабинета и публичной карточки спортсмена;
- есть demo seed для наполнения тестовыми участниками и рейтингом;
- есть scoring foundation: категории, базовые очки, расчет lag percent, начисление очков, top-3 ranking logic;
- есть signed cookie sessions для athlete/admin и logout flow;
- админские server actions в кабинете и moderation queue дополнительно проверяют admin session на уровне самого действия;
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
- `deploy:check` теперь должен считаться источником правды и по RLS drift: если на реальном Supabase выключен RLS на одной из app-таблиц `public`, релиз блокируется до фикса;
- production env для `DATABASE_URL` / `DIRECT_URL` уже заведены на реальные Supabase строки;
- есть подтвержденный Supabase demo snapshot, который можно безопасно пересидировать без глобального удаления данных.
- в репозитории есть Supabase hardening path: RLS для app-таблиц `public`, follow-up миграция для revoke legacy default grants и pre-deploy проверка на RLS drift;
- подготовлен отдельный операционный runbook `docs/DEPLOY_RUNBOOK.md` для server migration и hosted deploy: env checklist, Prisma path, stop conditions, rollback notes и post-deploy validation.
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
- публичное чтение leaderboard / athlete profile больше не запускает seed/upsert score rules на read path; seed остается в demo/moderation write flows.

Current limitation:
- это еще не production-ready MVP;
- авторизация стала безопаснее на уровне cookie/session, athlete magic link и admin credentials, но Telegram auth пока не подключен, а SMTP для production сознательно отложен на более поздний этап;
- импорт протоколов встроен в admin event create/update flow для поддержанных ссылок, но полноценного ручного UI для просмотра/редактирования строк `EventProtocolRow` еще нет;
- `runc.run` и `grom.place` уже имеют рабочие артефакты, но новые организаторы пока нужно добавлять вручную через отдельный skill;
- auto-import из кабинета уже работает через live parser для `runc.run` и `RaceResult`, но остальные организаторы по-прежнему не поддержаны;
- создание администраторов уже переведено в UI, но полноценный audit trail still uses the legacy fallback admin actor inside moderation actions;
- runtime уже живет на Postgres-first path, но production env layout (`DATABASE_URL`, `DIRECT_URL`, SMTP, public URL) еще не доведен до финального deploy shape;
- hosted deploy пока блокируется как минимум отсутствием production SMTP setup и публичного `APP_BASE_URL`; кроме того, локальная reachability Supabase может зависеть от среды выполнения;
- нет production deployment path для размещенного сайта;
- нет рабочего Telegram-бота для участников;
- часть legacy athlete web flows еще живет в коде и требует отдельного решения: оставить как fallback или удалить после подключения Telegram.

---

## 2. Confirmed Decisions

- Главный публичный канал продукта: `website`.
- Целевой интерфейс спортсмена для регистрации, изменения имени, отправки и удаления результатов: `Telegram bot`.
- Веб-сайт остается публичной витриной рейтинга, соревнований, правил и протоколов плюс рабочей админ-панелью.
- Для dev-режима допустим временный локальный persistence-layer, если он ускоряет реальную проверку UX.
- Рейтинг считается по сумме `3 лучших` подтвержденных результатов.
- Нет общего публичного рейтинга: мужской и женский зачеты считаются, сохраняются и показываются отдельно.
- Очки зависят от:
  - категории дистанции;
  - отставания от `5-го места` в возрастной группе.
- Для MVP формула очков фиксируется как `round(basePoints * exp(-0.077 * lagPercent))`.
- Если спортсмен быстрее `5-го места`, то `lagPercent = 0`, а максимум за старт равен `basePoints`.
- Случаи с группой менее `5` финишеров, `merged age groups` и отсутствием публичного протокола не автозасчитываются и идут в ручную модерацию.
- `DNS`, `DNF`, `DSQ` не участвуют в рейтинге.
- Tie-break в рейтинге: лучший результат, затем второй, затем третий, затем число подтвержденных зачетных результатов, затем shared place.
- В форме подачи результата дата старта выбирается календарем и хранится с годом; старый `дд.мм` формат остается совместимым для legacy/edit flows.
- Файл `PROJECT_STATUS.md` является основной межчатовой памятью проекта.
- Для публичной карточки спортсмена имя и полная история результатов контролируются самим спортсменом через настройки профиля.
- Следующий крупный UX/design этап не должен начинаться с переписывания проекта с нуля: сохраняем backend/core-логику, БД, auth, рейтинг, заявки и модерацию, а заново проектируем пользовательский путь, структуру страниц и визуальную систему поверх текущего ядра.
- Google Sheets не является целевым рабочим интерфейсом админа; подтверждение, редактирование и удаление результатов должны идти через админ-панель.
- Публичные карточки спортсменов и соревнований реализуются отдельными страницами, а не попапами, чтобы сохранить прямые ссылки и нормальный мобильный UX.
- `DESIGN.md` принят как визуальный ориентир: минимализм, белые поверхности, один синий акцент, компактные data-интерфейсы без лишнего декора.

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
- Main public routes: [web/src/app/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/page.tsx), [web/src/app/leaderboard/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/leaderboard/page.tsx), [web/src/app/events/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/events/page.tsx), [web/src/app/rules/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/rules/page.tsx), [web/src/app/participate/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/participate/page.tsx)
- Admin routes: [web/src/app/admin/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/admin/page.tsx), [web/src/app/admin/events/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/admin/events/page.tsx), [web/src/app/admin/athletes/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/admin/athletes/page.tsx), [web/src/app/admin/submissions/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/admin/submissions/page.tsx), [web/src/app/admin/broadcasts/page.tsx](/Users/satunkin/Codex_projects/rating/web/src/app/admin/broadcasts/page.tsx)
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
- `/admin`
- `/admin/events`
- `/admin/events/[eventId]/edit`
- `/admin/athletes`
- `/admin/athletes/[athleteId]`
- `/admin/broadcasts`
- `/results/new`
- `/results/[submissionId]/edit`
- `/admin/login`
- `/admin/submissions`
- `/events`
- `/events/[eventId]`
- `/leaderboard`
- `/rules`
- `/participate`
- `/athletes/[athleteId]`

---

## 4. Implemented

Implemented product slices:
- project bootstrap;
- git initialization and GitHub remote setup;
- PRD and implementation docs;
- public homepage;
- redesigned public homepage with immediate male/female top-10 leaderboard columns;
- Tesla-inspired public visual baseline from `DESIGN.md` applied to the new public/admin structure;
- `/participate` page for the Telegram-first athlete journey;
- `/admin` dashboard as the main administrator entry after login;
- dedicated admin sections `/admin/events`, `/admin/athletes`, `/admin/broadcasts`;
- admin login redirect now lands on `/admin`;
- public leaderboard and public athlete/event cards simplified for end-user reading without technical score-debug blocks;
- athlete-facing homepage with leaderboard preview, quick rules, and action-oriented navigation;
- athlete registration foundation;
- athlete login by email and password;
- athlete login by email magic link;
- athlete cabinet foundation;
- role-based cabinet with separate admin/athlete information architecture;
- result submission flow;
- result submission form with existing-event selection, auto-filled event metadata, local field validation, and field-level error highlighting;
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
- admin-facing server actions now require an active admin session before mutating events, athletes, submissions, moderation decisions, or demo data.
- public leaderboard reads no longer run score-rule seed/upsert work on every request.

Implemented developer validation:
- `npm run lint` passes after the 2026-05-30 UX redesign foundation;
- `npm run build` passes after the 2026-05-30 UX redesign foundation;
- in-app browser smoke check passed for `/`, `/leaderboard`, `/events`, `/participate`, `/admin/login`;
- mobile-width browser smoke check passed for `/`, `/leaderboard`, `/events` with no document-level horizontal overflow at `390px`;
- `npm run db:smoke:postgres` validates the runtime PostgreSQL path, but in some local/sandbox environments may fail if the current runtime cannot reach Supabase over the network;
- `npm run db:seed:demo` is rerunnable and produces a valid demo ranking snapshot on Supabase.
- `npm run deploy:check` теперь задуман как реальный pre-deploy smoke check для env + DB + SMTP readiness, включая проверку RLS на публичных app-таблицах.

---

## 5. Open Gaps

Still not done from the original project intent:
- production-hardening of participant identity around Telegram bot and any remaining web fallback;
- hosted deployment path for the website still needs a first real execution pass by the documented runbook;
- no first-class protocol row viewer/editor inside admin UI yet;
- first-class protocol rows editing/import UI for `EventProtocolRow`;
- semi-automatic or automatic result validation;
- management UI for seasons, score rules, event categories;
- appeals/dispute flow;
- notifications and Telegram broadcast delivery;
- working Telegram bot for participants;
- public filters beyond current leaderboard age-group/discipline filters and events discipline filter;
- protection against duplicates and moderation edge cases.
- final legal copy for user agreement and personal-data policy.

Current technical debt:
- Postgres runtime уже основной, но env-конвенция еще transitional: часть команд умеет fallback на `DATABASE_URL_POSTGRES`, а production-shaped `DATABASE_URL` / `DIRECT_URL` еще не закреплены как единственная схема;
- Prisma CLI path зависит от reachability `DIRECT_URL`; для Supabase direct host в некоторых локальных средах может понадобиться `session pooler :5432` вместо IPv6-only direct host;
- participant auth уже перешел на magic link baseline, но в production ему все еще нужен реальный SMTP, а admin auth still lacks proper RBAC / role-choice flow / audit attribution / 2FA;
- deploy-ready path частично упирается в среду: even with real Supabase envs local smoke checks могут падать, если текущий runtime не достукивается до хоста БД;
- RLS/policies под будущие прямые client-side сценарии пока не проектировались: текущая модель предполагает server-side доступ через Prisma, а не публичный Supabase Data API;
- organizer import layer пока ручной и file-based: новые организаторы нужно добавлять отдельными skills и fixture/request шаблонами;
- importer пока не различает финишеров и статусные строки на уровне отдельного enum: `DNF` / `DSQ` / `DQ` сохраняются как raw status fields в normalized artifacts и частично приходят в importer как строки без парсимого времени;
- organizer-level resolver уже есть для `runc.run` и `RaceResult`, но:
  - `RaceResult` пока опирается на XLSX link из `InfoText` config-а;
  - итоговый matching imported protocol rows к athlete submissions ещё не автоматизирован;
- legacy athlete web cabinet/result routes still exist for compatibility and need a later keep/remove decision after Telegram bot implementation;
- new admin broadcasts page is UX-only until Telegram delivery exists;
- часть UI-текстов уже адаптирована под новую структуру, но remaining copy pass and deeper backend-normalization still remain.

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
1. execute and verify the first real server migration + hosted deploy pass on the now-active PostgreSQL runtime using `docs/DEPLOY_RUNBOOK.md`;
2. отдельно догнать live Supabase до repository migrations и подтвердить, что warning `rls_disabled_in_public` исчез после `db:deploy` / SQL hotfix;
3. finish production email setup for magic-link auth (`SMTP`, `APP_BASE_URL`, end-to-end email check) after current product-critical coding slices;
4. keep public rating, admin dashboard, admin event/athlete management, moderation queue, and remaining fallback submission flows working on hosted production DB;
5. continue extending manual moderation toward protocol-aware helpers and connect the new protocol-import foundation to real admin workflows;
6. continue closing remaining ranking correctness gaps beyond exact duplicates and tie-break;
7. run end-to-end launch validation on hosted environment.
8. align backend statuses and remaining copy with the updated Telegram-first athlete journey.
9. add real role-selection flow for emails that should act as both athlete and admin.
10. decide whether legacy athlete web cabinet/result routes should remain as fallback after Telegram bot delivery.

P1 — important after P0, before broader growth:
1. укрепить live parser layer для `runc.run` и `RaceResult` на большем числе реальных стартов и добавить новых организаторов;
2. add notifications around moderation decisions;
3. align remaining ranking engine behavior with fixed tie-break and rules model;
4. expand public filters and management UI for score rules / event categories.

P2 — after core web MVP, before UX polish:
1. build working Telegram bot for participants;
2. connect Telegram bot to account / notification / lightweight submission flows.
3. connect `/admin/broadcasts` to real Telegram delivery with safe preview/confirmation.

P3 — after launch foundation:
1. finish UI polish requested in browser comments;
2. continue non-critical UX improvements;
3. add richer public experience and secondary product polish.

Current best next coding step:
- build the Telegram bot integration or deepen the admin protocol workflow (`EventProtocolRow` viewer/editor and matching imported rows to submissions), depending on Nikolay's priority.

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
- `2026-05-30`: audit pass hardened admin server actions, moved leaderboard public reads off write/seed paths, and improved result-submission UX validation.
- `2026-05-30`: redesign direction chosen: keep the current backend/core implementation and redesign UX structure, page hierarchy, and visual system in a follow-up chat.
- `2026-05-30`: UX redesign foundation implemented: public site moved to separate data-first pages, admin dashboard moved to `/admin`, athlete target journey became Telegram-first, and `DESIGN.md` became the visual baseline.
- `2026-06-01`: overall leaderboard removed from public UX; rating is male/female only, leaderboard gender filter was replaced by two tabs, public events gained discipline filtering and grouped multi-distance competition cards.
- `2026-06-01`: ranking numbering fixed to be independent per gender; male and female leaderboards both start from rank `1`.
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
- `2026-05-20`: базовая Prisma-миграция для включения RLS на public app-таблицах была добавлена в репозиторий; фактическое состояние удалённого Supabase нужно подтверждать отдельной проверкой против live DB.
- `2026-05-27`: Supabase hardening path reinforced with a follow-up migration for `public` default privileges and with an RLS check inside `deploy:check`, because remote Supabase state can still drift away from repository migrations.
- `2026-05-20`: server migration and deploy procedure documented in `docs/DEPLOY_RUNBOOK.md`; canonical rollout order is `db:deploy` first, hosted app deploy second, then `/api/health` and manual smoke checks.
- `2026-05-13`: exact duplicate result submissions are blocked both at athlete submit time and at admin approve time.
- `2026-05-13`: athlete magic-link verification moved from server-component render to route handler because Next.js 16 forbids cookie mutation during page render.
- `2026-05-13`: admin moderation now reuses existing event entities by event fingerprint instead of blindly creating a new Event on every approve.
- `2026-05-13`: `deploy:check` strengthened from env-only validation to a real pre-deploy smoke check covering PostgreSQL connectivity, required Prisma tables, and SMTP handshake.
- `2026-05-13`: admin moderation queue gained protocol-aware helper warnings and defaults for manual review.
- `2026-05-13`: season ranking recalculation aligned with the fixed tie-break policy and shared-place behavior.
- `2026-05-14`: ambiguous manual-review approvals now require explicit moderator confirmation flags and a written reason.
