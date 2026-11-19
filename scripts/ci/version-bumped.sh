#!/usr/bin/env bash
# Usage: scripts/ci/version-bumped.sh <base version> <head version>
# Exits 0 if <head version> is strictly greater than <base version> (MAJOR.MINOR.PATCH),
# 1 otherwise (not bumped, lower, or not a MAJOR.MINOR.PATCH version).
# Used on PRs to main: every production release must bump the version (see README).
set -uo pipefail

base="${1:-}"
head="${2:-}"
SEMVER='^[0-9]+\.[0-9]+\.[0-9]+$'

if ! [[ "$head" =~ $SEMVER ]]; then
  echo "Version '$head' is not MAJOR.MINOR.PATCH."
  exit 1
fi
if ! [[ "$base" =~ $SEMVER ]]; then
  # main has no valid version yet (first release): any valid version is a bump.
  echo "No valid base version ('$base'): $head accepted."
  exit 0
fi

IFS=. read -r b1 b2 b3 <<< "$base"
IFS=. read -r h1 h2 h3 <<< "$head"
for i in 1 2 3; do
  b="b$i" h="h$i"
  if (( 10#${!h} > 10#${!b} )); then echo "Version bumped: $base -> $head."; exit 0; fi
  if (( 10#${!h} < 10#${!b} )); then echo "Version $head is lower than $base."; exit 1; fi
done
echo "Version not bumped: still $head."
exit 1
