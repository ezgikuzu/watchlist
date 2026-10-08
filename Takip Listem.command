#!/bin/zsh
# Çift tıkla: Takip Listem sunucusunu başlatır ve tarayıcıda açar.
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")" || exit 1
[ -d node_modules ] || npm install
[ -f dist/index.html ] || npm run build
(sleep 1; open "http://localhost:5178") &
exec node server/index.js
