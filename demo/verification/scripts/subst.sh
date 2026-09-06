#!/bin/zsh
# subst.sh <template> <out> — substitute live Zefix credentials into a playbook.
set -eu
ENVFILE=${ZEFIX_ENV_FILE:-../prospex/.env}
u=$(grep -m1 '^ZEFIX_REST_API_USERNAME=' "$ENVFILE" | cut -d= -f2- | tr -d '"'"'"'')
p=$(grep -m1 '^ZEFIX_REST_API_PASSWORD=' "$ENVFILE" | cut -d= -f2- | tr -d '"'"'"'')
[ -n "$u" ] && [ -n "$p" ] || { echo "missing Zefix credentials in $ENVFILE" >&2; exit 1; }
U="$u" P="$p" perl -pe 's/__ZEFIX_USER__/$ENV{U}/g; s/__ZEFIX_PASS__/$ENV{P}/g' "$1" > "$2"
