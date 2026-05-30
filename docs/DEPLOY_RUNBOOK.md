# Cyclon Rating Server Migration And Deploy Runbook

Этот документ фиксирует безопасный путь первой production-миграции и выката для проекта `rating`.

## 1. Scope

Этот runbook покрывает:
- проверку production env;
- проверку статуса Prisma-миграций;
- применение миграций к серверной PostgreSQL БД;
- выкат Next.js приложения;
- post-deploy smoke checks;
- rollback considerations.

Текущий ожидаемый стек выката:
- app: `Next.js` в папке `web/`
- database: `Supabase PostgreSQL`
- schema management: `Prisma migrate deploy`
- primary hosting target: `Vercel`

## 2. Current Canonical Migration Path

Источник истины для Prisma schema:
- `web/prisma/schema.prisma`

Источник истины для production migration history:
- `web/prisma/postgres-migrations/`

Не использовать как production source of truth:
- `web/prisma/migrations/`

Текущий ожидаемый порядок серверных миграций:
1. `20260513183000_init`
2. `20260518110000_public_profile_and_submission_places`
3. `20260520090000_enable_rls_on_public_tables`

Ключевой принцип:
- сначала применяем миграции к БД;
- затем выкатываем новый код приложения;
- затем проверяем health endpoint и продуктовые сценарии.

## 3. Required Production Env

Обязательные переменные:
- `DATABASE_URL`
- `DIRECT_URL`
- `APP_BASE_URL`
- `SESSION_SECRET`
- `EMAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

Допустимый transitional fallback:
- `DATABASE_URL_POSTGRES`

Правила:
- `DATABASE_URL` должен быть runtime PostgreSQL URL для приложения;
- `DIRECT_URL` должен быть URL для Prisma CLI и миграций;
- `APP_BASE_URL` должен быть публичным URL сайта, не `localhost`;
- `SMTP_*` должны проходить handshake;
- `ADMIN_ACCESS_KEY` не считать production-ready auth mode.

## 4. Pre-Deploy Checklist

Выполнять из:

```bash
cd /Users/satunkin/Codex_projects/rating/web
```

### 4.1. Code And Git

Проверить:
- нужный commit уже запушен в GitHub;
- ветка для релиза определена;
- локальный код соответствует тому, что будет выкатываться.

Команды:

```bash
git status --short --branch
git log --oneline -5
```

Stop condition:
- если есть незакоммиченные изменения, не начинать deploy.

### 4.2. Dependencies And Prisma Client

Команды:

```bash
npm ci
npm run prisma:generate
npm run prisma:validate
```

Stop condition:
- если `prisma validate` падает, не идти дальше.

### 4.3. Production Env Readiness

Команда:

```bash
npm run deploy:check
```

Эта проверка должна подтвердить:
- env vars заполнены;
- runtime PostgreSQL reachable;
- ключевые Prisma tables существуют;
- SMTP проходит `verify()`.

Stop condition:
- любой blocker в `deploy:check` останавливает релиз.

### 4.4. Migration Status

Команда:

```bash
npm run db:status
```

Нужно подтвердить:
- Prisma использует `web/prisma/postgres-migrations`;
- нет unexpected drift;
- видно, какие миграции уже применены, а какие ещё нет.

Stop condition:
- если статус неясный, есть drift или непонятная divergence, сначала разбирать БД, потом релиз.

## 5. Safe Server Migration Sequence

### Step 1. Confirm Backup / Snapshot

Перед первой production-миграцией подтвердить:
- есть свежий backup или Supabase point-in-time recovery;
- понятен способ восстановления.

Без подтверждённого backup не применять миграции.

### Step 2. Apply Prisma Migrations

Команда:

```bash
npm run db:deploy
```

Ожидаемый результат:
- Prisma применяет отсутствующие миграции;
- migration history обновляется без ошибок.

Особо проверить:
- появилась миграция `20260518110000_public_profile_and_submission_places`, если её ещё не было на сервере;
- появилась миграция `20260520090000_enable_rls_on_public_tables`, если сервер ещё не догнан до текущего состояния репозитория.

Stop condition:
- если `db:deploy` падает, код не выкатывать.

### Step 3. Recheck Migration Status

Команда:

```bash
npm run db:status
```

Ожидаемый результат:
- Prisma показывает актуальный applied state без pending migrations.

### Step 4. Optional Runtime DB Smoke

Команда:

```bash
npm run db:smoke:postgres
```

Эта проверка полезна как быстрый sanity-check runtime connection string.

### Step 5. Deploy App

После успешной миграции выкатывать приложение в hosting environment.

Для Vercel это обычно означает:
1. env уже добавлены в project settings;
2. запускается build нового commit;
3. production deployment становится active.

Правило:
- не выкатывать новый app build до успешного `db:deploy`.

## 6. Post-Deploy Validation

### 6.1. Health Check

Проверить:

```text
/api/health
```

Ожидаемо:
- HTTP `200`
- `status: "ok"`

Если ответ `503` или есть blockers:
- deploy считать незавершённым;
- разбирать env, DB readiness или SMTP.

### 6.2. Public Smoke Checks

Проверить вручную:
1. `/`
2. `/leaderboard`
3. `/events`
4. `/events/[eventId]`
5. `/athletes/[athleteId]`
6. `/rules`

Что проверять:
- страницы открываются без 500;
- данные рейтинга и событий читаются;
- карточки спортсменов и событий не падают на новых полях.

### 6.3. Auth And Cabinet Checks

Проверить вручную:
1. `/admin/login`
2. athlete login / magic link flow
3. `/cabinet` для athlete
4. `/cabinet` для admin

Что проверять:
- cookie session создаётся;
- role-based routing работает;
- кабинет не падает на запросах к БД.

### 6.4. Feature Checks Tied To Current Schema

Проверить руками:
1. у спортсмена отображается `publicDisplayName`, если заполнено;
2. настройка `showPublicResults` влияет на публичную карточку;
3. в карточке события и спортсмена отображаются `placementOverall` и `placementInAgeGroup`;
4. сохранение события с `runc.run` или `RaceResult` ссылкой не ломает админский flow;
5. auto-import protocol rows отрабатывает без server error.

## 7. Production SQL / Schema Checks

Если `db:status` или runtime behaviour выглядят подозрительно, отдельно проверить в production DB:
- существует таблица `_prisma_migrations`;
- применены ожидаемые migration names;
- в `Athlete` есть:
  - `publicDisplayName`
  - `showPublicResults`
- в `ResultSubmission` есть:
  - `placementOverall`
  - `placementInAgeGroup`
- RLS enabled на основных `public`-таблицах согласно текущей миграции.

Если код и фактическая БД расходятся:
- источником истины для дальнейшей работы считать код репозитория;
- затем либо догонять БД через миграцию, либо документировать ручной drift и устранять его.

Важно для текущего Supabase access model:
- приложение сейчас ходит в БД через direct PostgreSQL connection + Prisma, а не через `supabase-js`, PostgREST или GraphQL;
- поэтому RLS на `public`-таблицах обязателен, а `GRANT` ролям `anon` / `authenticated` / `service_role` нужно выдавать только под осознанный Data API use case;
- hardening-миграция `20260527123000_supabase_public_schema_hardening` дополнительно ревокает legacy default privileges на будущие объекты `public`, чтобы новые таблицы не оказывались снаружи автоматически.

## 8. Rollback Notes

Важно:
- у текущего пути нет безопасного “one-click rollback” через Prisma down migrations;
- rollback нужно планировать как `restore backup / PITR` или как отдельный hotfix migration.

Риски rollback:
- RLS changes могут требовать отдельного SQL hotfix, если доступ внезапно блокируется;
- если новый код уже начал писать данные в новую схему, простой откат приложения без отката БД может не вернуть систему в консистентное состояние.

Минимальный rollback plan перед релизом:
1. знать, где лежит backup / snapshot;
2. знать, кто и как запускает restore;
3. понимать, можно ли быстро выключить проблемный deploy приложения отдельно от БД;
4. иметь готовность сделать emergency SQL/hotfix migration вместо полного restore, если проблема локальная.

## 9. Recommended Release Order

Рекомендуемая безопасная последовательность:
1. Confirm backup / restore path.
2. Confirm production env values.
3. Run `npm ci`.
4. Run `npm run prisma:generate`.
5. Run `npm run prisma:validate`.
6. Run `npm run deploy:check`.
7. Run `npm run db:status`.
8. Run `npm run db:deploy`.
9. Run `npm run db:status` again.
10. Deploy application build.
11. Check `/api/health`.
12. Run manual public/admin smoke checks.

## 10. Quick Command Block

```bash
cd /Users/satunkin/Codex_projects/rating/web
npm ci
npm run prisma:generate
npm run prisma:validate
npm run deploy:check
npm run db:status
npm run db:deploy
npm run db:status
```

После этого:
- выкатываем app build;
- проверяем `/api/health`;
- прогоняем ручной smoke-check по public pages, auth и admin event save.
