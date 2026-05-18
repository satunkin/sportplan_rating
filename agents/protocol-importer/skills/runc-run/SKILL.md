---
name: runc-run-protocol-import
description: Use when a race protocol comes from results.runc.run or runc.run. Extract the full finisher table for one distance, normalize it into the project protocol JSON, and prepare a request file for database import.
---

# runc.run Protocol Import

Используй этот skill только для `results.runc.run` / `runc.run`.

Workflow:
1. Открой страницу дистанции.
2. Попробуй переключить размер таблицы на максимум.
3. Если протокол разбит на страницы, собери все страницы одной дистанции, а не только первую.
4. Сохрани нормализованный JSON в `agents/protocol-importer/fixtures/normalized/`.
5. Создай request-файл в `agents/protocol-importer/fixtures/requests/`.
6. Прогони `dry-run` импорт через `web`.

Что вытаскивать:
- место в общем зачете;
- имя спортсмена;
- страну, если есть;
- сырую возрастную группу;
- стартовый номер, если есть;
- итоговое время;
- место в возрастной группе, если есть отдельно.

Нормализация:
- не меняй написание имени спортсмена;
- время сохраняй как `finishTimeRaw` ровно так, как его показывает протокол;
- если в протоколе нет отдельного места по возрастной группе, оставляй `null`;
- если удалось получить только часть строк, обязательно зафиксируй это в `notes` request-файла.

