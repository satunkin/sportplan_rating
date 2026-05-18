# Protocol Importer Agent

Назначение:
- забирать полный протокол соревнования у конкретного организатора;
- нормализовать строки в единый JSON-формат проекта;
- готовить request-файл для импорта в приложение;
- запускать безопасный import flow сначала в `dry-run`, потом в `apply`.

Базовый workflow:
1. Определи организатора по `sourceUrl`.
2. Открой соответствующий skill из `skills/`.
3. Получи полный протокол и сохрани нормализованный JSON в `fixtures/normalized/`.
4. Создай request-файл в `fixtures/requests/`.
5. Проверь импорт командой:
   - `cd /Users/satunkin/Codex_projects/rating/web`
   - `npm run db:import:protocol -- --request ../agents/protocol-importer/fixtures/requests/<file>.json`
6. Если summary корректен, запусти запись:
   - `npm run db:import:protocol -- --request ../agents/protocol-importer/fixtures/requests/<file>.json --apply`

Обязательные правила:
- не записывай данные в БД без промежуточного `dry-run`;
- не смешивай форматы разных организаторов в одном skill;
- если источник отдает неполный протокол, зафиксируй это в `notes` request-файла;
- не домысливай отсутствующие места или времена;
- если нельзя получить полный протокол, сохрани blockers и текущую степень полноты рядом с артефактом.

Контракты:
- нормализованный протокол: `contracts/normalized-event-protocol.schema.json`
- request на импорт: `contracts/protocol-import-request.schema.json`

