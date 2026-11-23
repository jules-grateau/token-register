#!/usr/bin/env bash
# Next step of the review loop of a PR (auto-pr.yml, D-060).
# Usage: bash scripts/automation/pr-next.sh review|fix|minor|finish <round>
#        bash scripts/automation/pr-next.sh block <reason>
# A step starts a new run of auto-pr.yml (develop's version: never the PR's own copy). A block
# puts "bloqué" on the PR and on its issue, and mentions the owner on both.
# Env: GH_TOKEN (App token), REPO, OWNER, RUN_URL, PR, ISSUE.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
step="${1:?step}"
case "$step" in
  review | fix | minor | finish)
    round="${2:?round}"
    echo "Suite : $step, tour $round."
    gh workflow run auto-pr.yml --repo "$REPO" --ref develop -f pr="$PR" -f step="$step" -f round="$round"
    ;;
  block)
    reason="${2:?reason}"
    bash "$DIR/block.sh" "$PR" "$reason"
    [ -n "${ISSUE:-}" ] && bash "$DIR/block.sh" "$ISSUE" "PR #$PR : $reason"
    ;;
  *)
    echo "pr-next.sh: unknown step '$step'" >&2
    exit 2
    ;;
esac
