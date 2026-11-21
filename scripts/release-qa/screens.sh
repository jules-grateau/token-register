#!/usr/bin/env bash
# Release QA (D-058), screens: starts a new instance of the image under test in <currency>,
# drives it with scripts/design-review/capture.mjs (every screen, every format), then checks
# the run with check-report.mjs (failed step, JS error, overflow, test data left behind).
# The instance is stopped and its volume deleted at the end.
#
# Usage: bash scripts/release-qa/screens.sh <TOKEN|EUR> <port>
# Env: QA_IMAGE, BASIC_AUTH_USER / BASIC_AUTH_PASS (see lib.sh),
#      PW_DIR (folder with Playwright installed and capture.mjs copied, default $RUNNER_TEMP/pw),
#      OUT (output folder, default ./release-qa-output): screenshots, report.json and
#      smoke-problems.md go to <OUT>/<currency>/.
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$DIR/../.." && pwd)"
# Folders given to Node: Windows form under Git Bash (pwd -W), unchanged elsewhere.
node_path() { (cd "$1" && { pwd -W 2> /dev/null || pwd; }); }
# shellcheck source=lib.sh
source "$DIR/lib.sh"

currency="${1:?currency}"
port="${2:?port}"
name="qa-ecrans-${currency,,}"
out="$(mkdir -p "${OUT:-release-qa-output}/${currency,,}" && cd "${OUT:-release-qa-output}/${currency,,}" && pwd)"

heading="### QA de release : écrans en $([ "$currency" = EUR ] && echo euros || echo jetons)"
summary() { [ -n "${GITHUB_STEP_SUMMARY:-}" ] && printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; return 0; }

qa_start "$name" "$currency" "$port"
if ! qa_wait_up "$name" "$port"; then
  echo "- écrans ($currency) : l'instance ne démarre pas" > "$out/smoke-problems.md"
  summary "$heading ❌" "L'instance ne démarre pas."
  qa_logs "$name"
  qa_stop "$name"
  exit 1
fi

summary "$heading"
(cd "${PW_DIR:-$RUNNER_TEMP/pw}" && APP_URL="http://localhost:$port" OUT_DIR="$(node_path "$out")" node capture.mjs > "$out/capture.log" 2>&1)
captured=$?
qa_stop "$name"
if [ "$captured" -ne 0 ]; then
  tail -n 20 "$out/capture.log"
  echo "- écrans ($currency) : la capture s'est arrêtée (voir capture.log dans l'artifact)" > "$out/smoke-problems.md"
  summary "❌ La capture s'est arrêtée avant le contrôle."
  exit 1
fi

# check-report.mjs writes smoke-problems.md in the current folder: one folder per currency.
cd "$out" && node "$(node_path "$REPO")/scripts/design-review/check-report.mjs" report.json
status=$?
# Prefix each problem with the currency, for the PR comment.
[ -s smoke-problems.md ] && sed -i "s/^- /- écrans ($currency) : /" smoke-problems.md
exit $status
