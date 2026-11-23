#!/usr/bin/env bash
# Stops the automation on an issue or a PR (D-060): label "bloqué", and a comment that
# mentions the owner, with the reason and the run. Through the issues API, which serves
# both issues and PRs.
# Usage: bash scripts/automation/block.sh <issue or PR number> <reason>
# Env: GH_TOKEN (App token), REPO, OWNER, RUN_URL.
set -uo pipefail

number="${1:?number}"
reason="${2:?reason}"
# The reason may quote an agent (D-060): no mention, no closing reference from it.
reason=$(printf '%s' "$reason" | node "$(cd "$(dirname "$0")" && pwd)/cli.mjs" neutral -)
gh api "repos/$REPO/issues/$number/labels" -f "labels[]=bloqué" > /dev/null || true
gh api "repos/$REPO/issues/$number/comments" -F body=@- > /dev/null << BODY
⛔ @$OWNER, l'automatisation s'arrête ici : $reason

Run : $RUN_URL

Pour reprendre : \`docs/automation/README.md\`, section « Reprendre après un \`bloqué\` ».
BODY
