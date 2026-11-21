#!/usr/bin/env bash
# Release QA (D-058): runs every scenario of scenarios/ against throwaway containers of the
# image under test, then writes a report in French.
#   - release-qa-report.md   : every check (also appended to $GITHUB_STEP_SUMMARY)
#   - release-qa-problems.md : failed checks only, one line each (posted on the PR by
#                              release-qa.yml), written only when something failed
# Exit 1 when a check failed.
#
# Usage: QA_IMAGE=token-register:qa bash scripts/release-qa/run.sh [scenario name filter]
# Needs Docker, curl and Node. Run from anywhere; outputs go to the current directory.
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$DIR/lib.sh"

if ! docker image inspect "$QA_IMAGE" > /dev/null 2>&1; then
  echo "Image $QA_IMAGE not found: build it first (docker build -t $QA_IMAGE .)" >&2
  exit 1
fi

export QA_RESULTS="$PWD/release-qa-results.tsv"
: > "$QA_RESULTS"
rm -f release-qa-problems.md
qa_cleanup

for scenario in "$DIR"/scenarios/*.sh; do
  name=$(basename "$scenario" .sh)
  [ -n "${1:-}" ] && [[ "$name" != *"$1"* ]] && continue
  echo "== $name"
  # A subshell per scenario: a scenario that stops half-way never stops the others.
  # shellcheck disable=SC1090
  ( export QA_SCENARIO="$name"; source "$scenario" )
  status=$?
  if [ "$status" -ne 0 ]; then
    printf 'KO\t%s\t%s\t%s\n' "$name" "le scénario s'est arrêté" "code de sortie $status" >> "$QA_RESULTS"
  fi
  qa_cleanup
done

ok=$(grep -c '^OK' "$QA_RESULTS")
ko=$(grep -c '^KO' "$QA_RESULTS")
{
  echo "### QA de release : démarrage, base neuve, commandes admin $([ "$ko" -eq 0 ] && echo ✅ || echo ❌)"
  echo
  echo "$ok vérification(s) réussie(s), $ko en échec."
  echo
  echo "| | Scénario | Vérification | Détail |"
  echo "|---|---|---|---|"
  while IFS=$'\t' read -r st sc desc detail; do
    detail=${detail//|/\\|}
    echo "| $([ "$st" = OK ] && echo ✅ || echo ❌) | $sc | $desc | ${detail:+\`${detail//\`/\'}\`} |"
  done < "$QA_RESULTS"
} > release-qa-report.md
cat release-qa-report.md
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat release-qa-report.md >> "$GITHUB_STEP_SUMMARY"

if [ "$ko" -gt 0 ] || [ "$ok" -eq 0 ]; then
  # Inline code: text from the app must not render as Markdown or @mentions in the comment.
  grep '^KO' "$QA_RESULTS" | while IFS=$'\t' read -r _ sc desc detail; do
    echo "- $sc : $desc${detail:+ (\`${detail//\`/\'}\`)}"
  done > release-qa-problems.md
  [ "$ok" -eq 0 ] && [ "$ko" -eq 0 ] && echo "- aucun scénario n'a tourné" > release-qa-problems.md
  exit 1
fi
