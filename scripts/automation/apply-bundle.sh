#!/usr/bin/env bash
# Checks the developer's commits (git bundle from make-bundle.sh) and pushes them (D-060). Run
# in a job that starts from develop and holds the App token, never in the agent's job.
# Checks, in order; the first one that fails is printed and the script exits 1, nothing pushed:
#   1. the target branch is a work branch (feature/* or fix/*, lib.mjs isWorkBranch);
#   2. the commits descend from <base> (develop's head for a new branch, the PR's head for a
#      fix) and the remote branch is still where it was (absent for a new branch, <base> for
#      a fix);
#   3. no file under .github/ is touched.
# Then pushes this exact branch: git push <origin> <commit>:refs/heads/<branch>, no force.
# Usage: bash apply-bundle.sh <bundle> <branch> <base sha> new|existing
# Env: PUSH_TOKEN and REPO (push to GitHub), or PUSH_URL (tests: any git remote).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
bundle="${1:?bundle}"
branch="${2:?branch}"
base="${3:?base}"
mode="${4:?new|existing}"
url="${PUSH_URL:-https://x-access-token:${PUSH_TOKEN:-}@github.com/${REPO:-}.git}"
fail() { echo "$1"; exit 1; }

[ "$(node "$DIR/cli.mjs" work-branch "$branch")" = true ] ||
  fail "la branche « $branch » n'est ni feature/* ni fix/*."
[ -s "$bundle" ] || fail "aucun commit à pousser."

git cat-file -e "$base^{commit}" 2> /dev/null || git fetch -q "$url" "$base" 2> /dev/null ||
  fail "la base $base est introuvable."
git bundle verify -q "$bundle" > /dev/null 2>&1 || fail "le bundle des commits est invalide."
git fetch -q "$bundle" "+refs/heads/$branch:refs/auto/work" 2> /dev/null ||
  fail "le bundle ne contient pas la branche « $branch »."
work=$(git rev-parse refs/auto/work)

git merge-base --is-ancestor "$base" "$work" || fail "les commits ne descendent pas de $base."
remote=$(git ls-remote "$url" "refs/heads/$branch" | cut -f1)
case "$mode" in
  new) [ -z "$remote" ] || fail "la branche « $branch » existe déjà sur le dépôt." ;;
  existing) [ "$remote" = "$base" ] || fail "la branche « $branch » a bougé pendant la correction." ;;
  *) fail "mode inconnu : $mode" ;;
esac

touched=$(git diff --name-only "$base" "$work" | grep '^\.github/' || true)
[ -z "$touched" ] || fail "les commits touchent \`.github/\` ($(echo "$touched" | head -3 | tr '\n' ' ')), ce que l'automatisation ne pousse jamais."

git push -q "$url" "$work:refs/heads/$branch"
echo "ok $work"
