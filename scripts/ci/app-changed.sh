#!/usr/bin/env bash
# Usage: scripts/ci/app-changed.sh <git range>   (e.g. "base...head" or "before..after")
# Prints "true" if the range touches anything that can affect the app (code, deps,
# Dockerfile, CI/CD pipeline...), "false" if it only touches files that never reach
# the app: agent prompts, docs, markdown, review-only workflows and scripts, and the
# GitHub automation (D-060: the auto-*.yml workflows listed below, scripts/automation/).
# When in doubt (unknown range, git error), prints "true": better a useless run than
# a missed deploy. --no-renames: a file moved out of the app (e.g. into docs/) must
# still count as an app change through its old path.
set -uo pipefail

range="${1:-}"
[ -z "$range" ] && { echo true; exit 0; }

if ! files=$(git diff --name-only --no-renames "$range" 2>/dev/null); then
  echo true
  exit 0
fi
[ -z "$files" ] && { echo false; exit 0; }

NON_APP='^(\.claude/|docs/|scripts/(design-review|release-qa|automation)/|\.github/workflows/(tech-lead-review|design-review|release-qa|auto-(issue|pr|release-pr|tests))\.yml$)|\.md$'
# Markdown inside the app workspaces could be imported by the build: it counts.
APP_DIRS='^(api|client|shared-ts)/'

while IFS= read -r file; do
  if [[ "$file" =~ $APP_DIRS ]] || ! [[ "$file" =~ $NON_APP ]]; then
    echo true
    exit 0
  fi
done <<< "$files"
echo false
