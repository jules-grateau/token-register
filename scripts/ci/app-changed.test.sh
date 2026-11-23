#!/usr/bin/env bash
# Tests for app-changed.sh, run in a throwaway git repo. Run: bash scripts/ci/app-changed.test.sh
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/app-changed.sh"
REPO="$(mktemp -d)"
trap 'rm -rf "$REPO"' EXIT
cd "$REPO" || exit 1
git init -q && git config user.email ci@example.com && git config user.name ci
mkdir -p api/src client docs .claude/agents scripts/design-review .github/workflows
echo base > api/src/x.ts && echo base > README.md && git add -A && git commit -qm base

failures=0
# check <description> <expected> <files to touch...> ; "mv:a:b" moves a to b
check() {
  local desc="$1" expected="$2"; shift 2
  local before; before=$(git rev-parse HEAD)
  for f in "$@"; do
    if [[ "$f" == mv:* ]]; then IFS=: read -r _ from to <<< "$f"; git mv "$from" "$to"
    else mkdir -p "$(dirname "$f")"; echo "$RANDOM" >> "$f"; git add "$f"; fi
  done
  git commit -qm "$desc"
  local got; got=$(bash "$SCRIPT" "$before..HEAD")
  if [ "$got" = "$expected" ]; then echo "ok   $desc"; else echo "FAIL $desc: expected $expected, got $got"; failures=$((failures + 1)); fi
}

check "agent prompt only"            false .claude/agents/dev.md
check "docs + root markdown"         false docs/x.md CLAUDE.md
check "review-only workflow/script"  false .github/workflows/tech-lead-review.yml scripts/design-review/capture.mjs
check "release QA workflow/scripts"  false .github/workflows/release-qa.yml scripts/release-qa/run.sh scripts/release-qa/scenarios/01-x.sh
check "automation workflows/scripts" false .github/workflows/auto-issue.yml .github/workflows/auto-pr.yml .github/workflows/auto-release-pr.yml .github/workflows/auto-tests.yml scripts/automation/lib.mjs
check "other auto-* workflow"        true  .github/workflows/auto-deploy.yml
check "workflow named like auto"     true  .github/workflows/autodeploy.yml
check "app code"                     true  api/src/y.ts
check "docs + app code"              true  docs/y.md client/z.tsx
check "markdown inside the app"      true  client/notes.md
check "ci-cd pipeline"               true  .github/workflows/ci-cd.yml
check "dependencies"                 true  package-lock.json
check "app file moved into docs"     true  mv:api/src/x.ts:docs/moved.md

got=$(bash "$SCRIPT" ""); [ "$got" = true ] && echo "ok   empty range -> true" || { echo "FAIL empty range: $got"; failures=$((failures + 1)); }
got=$(bash "$SCRIPT" "deadbeef..HEAD"); [ "$got" = true ] && echo "ok   unknown range -> true" || { echo "FAIL unknown range: $got"; failures=$((failures + 1)); }
got=$(bash "$SCRIPT" "HEAD..HEAD"); [ "$got" = false ] && echo "ok   no change -> false" || { echo "FAIL no change: $got"; failures=$((failures + 1)); }

[ "$failures" -eq 0 ] && echo "All tests passed" || { echo "$failures test(s) failed"; exit 1; }
