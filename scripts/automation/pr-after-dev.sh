#!/usr/bin/env bash
# After the developer fixed a review (auto-pr.yml, developer-next, D-060): pushes its commits
# once checked (apply-bundle.sh; no bundle = nothing to push, only ⏸️ or ❓ answers for
# instance), publishes its replies and recap, then starts the next step or stops.
# Env: RESULT (developer job result), OUT (its structured output), HEAD_BRANCH, BASE (the PR's
#      head when it started), BUNDLE, STEP, ROUND, PR, ISSUE, REPO, OWNER, RUN_URL, GH_TOKEN,
#      PUSH_TOKEN (or PUSH_URL in tests).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cli() { node "$DIR/cli.mjs" "$@"; }

if [ "$RESULT" != success ]; then
  bash "$DIR/pr-next.sh" block "le développeur a échoué (étape $STEP, tour $ROUND)."
  exit 0
fi
dev="$(mktemp)"
printf '%s' "$OUT" > "$dev"
status=$(cli field "$dev" status)
summary=$(cli field "$dev" comment)
if [ -s "$BUNDLE" ]; then
  if ! why=$(bash "$DIR/apply-bundle.sh" "$BUNDLE" "$HEAD_BRANCH" "$BASE" existing); then
    bash "$DIR/pr-next.sh" block "commits du développeur refusés : $why"
    exit 0
  fi
fi
node "$DIR/publish-answers.mjs" "$dev"
case "$status:$STEP" in
  done:fix) bash "$DIR/pr-next.sh" review "$((ROUND + 1))" ;;
  done:minor) bash "$DIR/pr-next.sh" finish "$ROUND" ;;
  questions:*) bash "$DIR/pr-next.sh" block "❓ choix métier à confirmer, voir la réponse du développeur sur la PR. $summary" ;;
  *) bash "$DIR/pr-next.sh" block "le développeur ne peut pas avancer : $summary" ;;
esac
