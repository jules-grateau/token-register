#!/usr/bin/env bash
# Tests for version-bumped.sh. Run: bash scripts/ci/version-bumped.test.sh
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/version-bumped.sh"
failures=0

# check <expected exit code> <base> <head>
check() {
  local expected="$1" base="$2" head="$3"
  bash "$SCRIPT" "$base" "$head" > /dev/null
  local got=$?
  if [ "$got" = "$expected" ]; then echo "ok   '$base' -> '$head' = $expected"
  else echo "FAIL '$base' -> '$head': expected $expected, got $got"; failures=$((failures + 1)); fi
}

check 0 1.0.0 1.0.1
check 0 1.0.9 1.1.0
check 0 1.9.9 2.0.0
check 0 1.2.9 1.2.10
check 0 "" 1.0.0
check 0 undefined 1.0.0
check 1 1.0.0 1.0.0
check 1 1.2.0 1.1.9
check 1 2.0.0 1.9.9
check 1 1.0.0 1.0
check 1 1.0.0 1.0.0-beta
check 1 1.0.0 ""

[ "$failures" -eq 0 ] && echo "All tests passed" || { echo "$failures test(s) failed"; exit 1; }
