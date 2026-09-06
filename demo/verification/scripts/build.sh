#!/bin/zsh
# Renders verification.template.yaml -> verification.yaml with live credentials.
set -eu
DIR=${0:a:h}
exec "$DIR/subst.sh" "$DIR/../verification.template.yaml" "$DIR/../verification.yaml"
