#!/usr/bin/env bash
# Adds and removes labels on an issue or a PR (issues API, which serves both).
# Usage: bash scripts/automation/labels.sh <number> [+label] [-label]...
# Adding fails loudly (a missing label must be seen: docs/automation/README.md creates them);
# removing a label that is not there is not an error.
# Env: GH_TOKEN, REPO.
set -uo pipefail

number="${1:?number}"; shift
status=0
for change in "$@"; do
  name="${change:1}"
  case "$change" in
    +*) gh api "repos/$REPO/issues/$number/labels" -f "labels[]=$name" > /dev/null || status=1 ;;
    -*) gh api -X DELETE "repos/$REPO/issues/$number/labels/$(node -p 'encodeURIComponent(process.argv[1])' "$name")" > /dev/null 2>&1 || true ;;
    *) echo "labels.sh: '$change' must start with + or -" >&2; status=2 ;;
  esac
done
exit $status
