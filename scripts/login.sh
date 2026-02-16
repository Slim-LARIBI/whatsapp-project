#!/usr/bin/env bash
set -e

cat > /tmp/login.json <<'JSON'
{"email":"laribi.slim@gmail.com","password":"Test1234!"}
JSON

TOKEN="$(curl -s http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/login.json \
| sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')"

export TOKEN
echo "TOKEN_LEN=${#TOKEN}"
