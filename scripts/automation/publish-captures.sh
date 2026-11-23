#!/usr/bin/env bash
# Publishes the design review captures of a PR on the design-review-screenshots branch, under
# pr-<n>/ci-r<round>/ (jetons/ and eur/), from a temporary worktree: the checkout of the PR
# does not change branch. Captures come from throwaway instances (no client name).
# Usage: bash scripts/automation/publish-captures.sh <pr> <round> <captures folder>
# Env: the checkout's credentials (App token) and git identity (setup.sh).
set -euo pipefail

pr="${1:?pr}"
round="${2:?round}"
from="${3:?captures folder}"
wt="$RUNNER_TEMP/screenshots"
dest="pr-$pr/ci-r$round"

git fetch -q origin design-review-screenshots
git worktree add -q -B design-review-screenshots "$wt" origin/design-review-screenshots
rm -rf "${wt:?}/$dest" && mkdir -p "$wt/$dest"
cp -r "$from"/. "$wt/$dest/"
git -C "$wt" add "$dest"
git -C "$wt" commit -q -m "captures: PR #$pr, revue design automatique, tour $round (jetons + EUR, mobile + desktop)"
git -C "$wt" push -q origin design-review-screenshots
git worktree remove --force "$wt"
echo "Captures publiées sous $dest."
