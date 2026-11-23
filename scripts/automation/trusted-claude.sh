#!/usr/bin/env bash
# After checking out a PR (auto-pr.yml): puts back what Claude reads from the checkout as it
# is on develop (.claude/, CLAUDE.md, .mcp.json; copied by setup.sh before the PR was checked
# out). A PR must not rewrite the rules of its own reviewers, nor add a hook or an MCP server
# that would run in the job. A file that develop does not have is removed.
# The swap is hidden from git, so that the developer's commits never include it.
# Usage: bash "$TRUSTED/trusted-claude.sh"   (in the PR checkout)
set -euo pipefail

src="$RUNNER_TEMP/trusted-claude"
[ -d "$src" ] || { echo "::error::Copie de .claude/ absente (setup.sh)."; exit 1; }
for item in .claude CLAUDE.md .mcp.json; do
  git ls-files -z -- "$item" | xargs -0 -r git update-index --skip-worktree
  rm -rf "$item"
  [ -e "$src/$item" ] && cp -r "$src/$item" "$item"
done
# Files of develop that the PR does not have: untracked, kept out of `git add -A`.
git ls-files --others --exclude-standard -- .claude CLAUDE.md .mcp.json >> .git/info/exclude
echo "Consignes et réglages Claude de develop en place."
