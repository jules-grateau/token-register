#!/usr/bin/env bash
# Checks the developer's commits (git bundle from make-bundle.sh) and pushes them (D-060). Run
# in a job that starts from develop and holds the App token, never in the agent's job.
# Checks, in order; the first one that fails is printed and the script exits 1, nothing pushed:
#   1. the target branch is a work branch (feature/* or fix/*, lib.mjs isWorkBranch);
#   2. the commits descend from <base> (develop's head for a new branch, the PR's head for a
#      fix) and the remote branch is still where it was (absent for a new branch, <base> for
#      a fix);
#   3. no commit is a merge, and no commit touches a refused path (each commit, renames seen
#      as delete + add): .github/, .claude/, CLAUDE.md, .mcp.json, scripts/automation/,
#      scripts/ci/. What runs the automation, the CI or the agents is changed in a local
#      session, never by an agent;
#   4. no commit message has a closing keyword ("fixes #12"): commits reach main at the
#      release, where it would close that issue. Only the workflow writes "Closes #n".
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

[ -z "$(git rev-list --merges "$base..$work")" ] || fail "les commits contiennent un merge, ce que l'automatisation ne pousse pas."
REFUSED='^(\.github/|\.claude/|CLAUDE\.md$|\.mcp\.json$|scripts/automation/|scripts/ci/)'
# -z and core.quotePath=false: a non-ASCII path is listed as is, never quoted ("\303\251"),
# so it cannot slip past the check.
touched=""
while IFS= read -r -d '' path; do
  [[ "$path" =~ $REFUSED ]] && touched+="$path"$'\n'
done < <(git -c core.quotePath=false log -z --no-renames --name-only --format= "$base..$work")
touched=$(printf '%s' "$touched" | sort -u)
[ -z "$touched" ] || fail "les commits touchent des fichiers réservés ($(echo "$touched" | head -3 | tr '\n' ' ')) : workflows, CI, consignes des agents ou automatisation. Ce changement se fait en session locale, pas par un agent."
# Commit messages: no closing keyword (same words as neutralize in lib.mjs).
if git log --format=%B "$base..$work" | grep -qiE '\b(close[sd]?|fix(e[sd])?|resolve[sd]?)[[:space:]]*:?[[:space:]]+#[0-9]'; then
  fail "un message de commit contient un mot-clé de fermeture (« fixes #n »…), qui fermerait une issue à la release. Seul le workflow écrit « Closes #n » : reformuler le message sans ce mot-clé."
fi

git push -q "$url" "$work:refs/heads/$branch"
echo "ok $work"
