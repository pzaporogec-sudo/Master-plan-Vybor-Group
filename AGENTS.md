# Правила проекта

- Русский интерфейс, общая стилистика «Мой ИЖС»: белый фон, #155EEF, текст #18253B.
- Учебные расчёты явно маркировать. Реальные материалы хранить только в локальной БД раздела DATA AI, не публиковать в Git. Не выдавать алгоритмы правил за работающие LLM.
- G0: ровно 10 пунктов исходного регламента. Пропуск или отсутствие основания блокирует старт.
- Красный маршрут запрещает генерацию вариантов; жёлтый не обещает SLA 72 часа.
- Изменение вводных отменяет прежнее согласование. Автор не проверяет свой результат.
- Локальные демо-роли не публиковать в интернете. Не добавлять ключи, реальные документы и персональные данные в Git. Внешний анализ — только после явного согласия на передачу выбранных источников.
- Проверки: npm test, npm run build, npm run test:e2e при запущенном сервере.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
