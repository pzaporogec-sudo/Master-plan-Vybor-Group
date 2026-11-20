# Состав первой версии

Репозиторий до работы был пуст. Все перечисленные файлы добавлены.

- `.gitignore`, `AGENTS.md`, `README.md` — правила, ограничения, запуск.
- `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `postcss.config.mjs` — сборка и зависимости.
- `app/layout.tsx`, `app/page.tsx`, `app/workspace.tsx`, `app/globals.css` — интерфейс, серверная загрузка данных и адаптивность.
- `app/api/login/route.ts` — локальные сессии.
- `app/api/projects/route.ts` — создание территории.
- `app/api/projects/[id]/route.ts` — вводные, расчёты, проверка, решение, экспорт.
- `lib/auth.ts`, `lib/db.ts`, `lib/domain.ts` — защита, БД, проверяемая модель.
- `prisma/schema.prisma`, `prisma/seed.ts` — схема и демонстрационные данные.
- `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, `public/icon-192.png`, `public/icon-512.png` — PWA и ограниченный офлайн-режим.
- `scripts/init-db.mjs`, `scripts/icons.mjs`, `Запустить.command` — подготовка и запуск.
- `tests/domain.test.ts`, `tests/e2e.ts` — тесты.
- `docs/ARCHITECTURE.md`, `docs/LEGAL-CHECKLIST.md`, `docs/VALIDATION.md`, `docs/CHANGED-FILES.md` — документация.
- `docs/desktop.jpg`, `docs/mobile-390.jpg`, `docs/plans.jpg` — доказательства браузерной проверки.

База `prisma/dev.db`, node_modules и .next созданы локально и не входят в репозиторий или комплект исходников на рабочем столе. Внутренние исходные документы из папки мастер-планирования не изменены и не загружены в публичный GitHub.
