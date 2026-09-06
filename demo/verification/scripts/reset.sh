#!/bin/zsh
# Puts the n8n instance back to a pre-demo state: logged-in owner exists,
# the community package is NOT installed, and no workflows are saved.
set -u
BASE=http://localhost:5678
JAR=$(mktemp)
curl -s -c "$JAR" -X POST "$BASE/rest/login" -H 'Content-Type: application/json' \
  -d '{"emailOrLdapLoginId":"semion.sidorenko@letemps.ch","password":"DemoPassw0rd!"}' >/dev/null
if [ "${NDEMO_KEEP_PACKAGE:-0}" != "1" ]; then
  curl -s -b "$JAR" -X DELETE "$BASE/rest/community-packages?name=n8n-nodes-zefix-shab" >/dev/null 2>&1
fi
for id in $(curl -s -b "$JAR" "$BASE/rest/workflows" | grep -oE '"id":"[^"]+"' | cut -d'"' -f4); do
  curl -s -b "$JAR" -X DELETE "$BASE/rest/workflows/$id" >/dev/null
done
for id in $(curl -s -b "$JAR" "$BASE/rest/credentials" | grep -oE '"id":"[^"]+"' | cut -d'"' -f4); do
  curl -s -b "$JAR" -X DELETE "$BASE/rest/credentials/$id" >/dev/null
done
rm -f "$JAR"
