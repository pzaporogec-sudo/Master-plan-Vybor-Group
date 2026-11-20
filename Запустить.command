#!/bin/zsh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Установите Node.js 22.15 или новее с nodejs.org, затем повторите запуск.'
  read -r '?Нажмите Enter для закрытия.'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm install --cache /private/tmp/master-plan-npm-cache
fi
npm run db:setup
echo 'Откройте http://127.0.0.1:3100 в браузере. Остановка: Ctrl+C.'
npm run dev
