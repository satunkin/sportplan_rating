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
- есть demo seed для наполнения тестовыми участниками и рейтингом;
- есть scoring foundation: категории, базовые очки, расчет lag percent, начисление очков, top-3 ranking logic;
- есть dev persistence через `SQLite + better-sqlite3 bootstrap + Prisma client`.

Current limitation:
- это еще не production-ready MVP;
- авторизация временная и упрощенная;
- протоколы соревнований не импортируются автоматически;
- реальный PostgreSQL workflow и Prisma migrations еще не доведены до целевого состояния.

---

## 2. Confirmed Decisions

- Главный канал продукта: `website`.
- Telegram пока не является основным интерфейсом MVP.
- Для dev-режима допустим временный локальный persistence-layer, если он ускоряет реальную проверку UX.
- Рейтинг считается по сумме `3 лучших` подтвержденных результатов.
- Очки зависят от:
  - категории дистанции;
  - отставания от `5-го места` в возрастной группе.
- Для текущего dev/demo flow дата старта в форме результата вводится в рамках `текущего сезона`.
- Файл `PROJECT_STATUS.md` является основной межчатовой памятью проекта.

---

## 3. Architecture

Frontend / app shell:
- `Next.js app router`
- `Tailwind CSS`

Data / backend:
- `Prisma client`
- dev persistence: `SQLite`
- runtime bootstrap таблиц: `better-sqlite3`

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
- `/athletes/[athleteId]`

---

## 4. Implemented

Implemented product slices:
- project bootstrap;
- git initialization and GitHub remote setup;
- PRD and implementation docs;
- public homepage;
- athlete registration foundation;
- athlete cabinet foundation;
- result submission flow;
- admin login with dev access key;
- manual moderation queue;
- approval/rejection flow;
- score rules seed;
- verified results creation;
- ranking recalculation;
- public leaderboard;
- public athlete page;
- demo data generation.

Implemented developer validation:
- `npm run lint` passes after recent working cycles;
- `npm run build` passes after recent working cycles;
- `node scripts/seed-demo.mjs` produces a valid demo ranking snapshot.

---

## 5. Open Gaps

Still not done from the original project intent:
- real authentication flow (`email magic link` or `Telegram auth`);
- real production DB setup on `PostgreSQL`;
- stable Prisma migration workflow as source of truth;
- event/protocol import flow;
- semi-automatic or automatic result validation;
- management UI for seasons, score rules, event categories;
- full rules page / methodology page;
- appeals/dispute flow;
- notifications;
- public filters beyond current basic leaderboard filters;
- protection against duplicates and moderation edge cases.

Current technical debt:
- dev DB bootstrapping is practical but temporary;
- admin auth is simplified via `ADMIN_ACCESS_KEY`;
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
node scripts/seed-demo.mjs
npm run dev
```

Admin demo access:
- route: `/admin/login`
- env key: `ADMIN_ACCESS_KEY`
- current local dev value in `.env`: `cyclon-admin-dev`

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

Recommended next implementation order:
1. finish UI polish requested in browser comments and confirm homepage/cabinet flow visually;
2. make auth less temporary;
3. replace dev-only persistence approach with cleaner production-oriented persistence;
4. add event/protocol management model for real moderation;
5. add methodology / rules page and expose scoring explanation cleanly;
6. move toward real MVP acceptance criteria from the PRD.

Current best next coding step:
- complete the active UI feedback pass from browser comments before resuming deeper backend work.

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
