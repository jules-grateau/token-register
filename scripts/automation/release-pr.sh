#!/usr/bin/env bash
# Creates the release PR develop -> main, or updates it if one is open (D-060). Title
# "Release v<develop version>", body = the PRs merged since main, the issues they close
# (so they close at the release), and a warning when develop's version is not above main's.
# Created ready: the owner merges it once the release QA is green (D-058).
# Env: GH_TOKEN (App token: a PR created with GITHUB_TOKEN would not start the release QA),
#      REPO, AUTO.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"
cli() { node "$DIR/cli.mjs" "$@"; }
version_of() { git show "$1:package.json" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version"; }

git fetch -q origin main develop
if [ "$(git rev-list --count origin/main..origin/develop)" -eq 0 ]; then
  echo "develop n'a rien de plus que main : pas de PR de release."
  exit 0
fi

git log --first-parent --format=%s origin/main..origin/develop > "$AUTO/subjects.txt"
echo '[' > "$AUTO/prs.json"
first=true
for n in $(cli merged-prs "$AUTO/subjects.txt"); do
  $first || echo ',' >> "$AUTO/prs.json"
  first=false
  # A PR that cannot be read (a "(#n)" in a commit title that is not a PR...) is listed as such,
  # with a warning: it never stops the update silently.
  if gh pr view "$n" --repo "$REPO" --json number,title,body > "$AUTO/pr.json" 2> "$AUTO/pr.err"; then
    cat "$AUTO/pr.json" >> "$AUTO/prs.json"
  else
    echo "::warning::PR #$n illisible : $(head -c 200 "$AUTO/pr.err")"
    printf '{"number":%s,"title":"(PR illisible, à vérifier)","body":""}' "$n" >> "$AUTO/prs.json"
  fi
done
echo ']' >> "$AUTO/prs.json"

version=$(version_of origin/develop)
main_version=$(version_of origin/main)
bumped=false
bash "$REPO_ROOT/scripts/ci/version-bumped.sh" "$main_version" "$version" > /dev/null && bumped=true

cli release-pr "$AUTO/prs.json" "$version" "$main_version" "$bumped" > "$AUTO/release.json"
title=$(cli field "$AUTO/release.json" title)
cli field "$AUTO/release.json" body > "$AUTO/release.md"

existing=$(gh pr list --repo "$REPO" --base main --head develop --state open --json number --jq '.[0].number // empty')
if [ -n "$existing" ]; then
  gh pr edit "$existing" --repo "$REPO" --title "$title" --body-file "$AUTO/release.md" > /dev/null
  echo "PR de release #$existing mise à jour : $title."
else
  gh pr create --repo "$REPO" --base main --head develop --title "$title" --body-file "$AUTO/release.md"
fi
