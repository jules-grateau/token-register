#!/usr/bin/env bash
# After checking out a PR (auto-pr.yml): puts back develop's .claude/ (agents' instructions,
# Claude settings), copied by setup.sh before the PR was checked out. A PR must not rewrite
# the rules of its own reviewers, nor add a hook that would run with the job's tokens.
# The swap is hidden from git, so that the developer's commits never include it.
# Usage: bash "$TRUSTED/trusted-claude.sh"   (in the PR checkout)
set -euo pipefail

src="$RUNNER_TEMP/trusted-claude"
[ -d "$src" ] || { echo "::error::Copie de .claude/ absente (setup.sh)."; exit 1; }
git ls-files -z .claude | xargs -0 -r git update-index --skip-worktree
rm -rf .claude && cp -r "$src" .claude
# Files of develop that the PR does not have: untracked, kept out of `git add -A`.
git ls-files --others --exclude-standard .claude >> .git/info/exclude
echo "Consignes et réglages Claude de develop en place."
