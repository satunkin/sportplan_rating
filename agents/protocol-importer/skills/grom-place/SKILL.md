---
name: grom-place-protocol-import
description: Use when a race protocol belongs to grom.place and is published through RaceResult. Resolve the actual results source, extract the full protocol, normalize it into the project JSON, and prepare a request file for database import.
---

# grom.place Protocol Import

Используй этот skill для стартов `grom.place`, даже если сам протокол открыт на `RaceResult`.

Workflow:
1. Зафиксируй исходную ссылку `grom.place` или `RaceResult`.
2. Определи реальный endpoint протокола: публичная results-страница, export, static result page или txt/csv-выгрузка.
3. Убедись, что извлекается полный протокол нужной дистанции, а не только видимый фрагмент UI.
4. Сохрани нормализованный JSON в `agents/protocol-importer/fixtures/normalized/`.
5. Создай request-файл в `agents/protocol-importer/fixtures/requests/`.
6. Прогони `dry-run` импорт через `web`.

Что важно для RaceResult:
- UI может быть недоступен из браузерного окружения, поэтому сначала ищи export/static result endpoints;
- если источник блокируется, зафиксируй blocker рядом с request-файлом и не притворяйся, что импорт полный;
- не импортируй HTML-обрезок как полноценный протокол.

