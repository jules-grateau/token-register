#!/usr/bin/env bash
# Tests of make-bundle.sh + apply-bundle.sh on throwaway repos: a bare "origin", the agent's
# clone (commits, bundle) and the follow-up's clone (checks, push).
# Run: bash scripts/automation/apply-bundle.test.sh
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.com GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.com
git init -q --bare "$T/origin.git"
git clone -q "$T/origin.git" "$T/seed" 2> /dev/null
(cd "$T/seed" && git checkout -q -b develop && echo base > a.txt && git add a.txt && git commit -qm base && git push -q origin develop)
BASE=$(git -C "$T/seed" rev-parse HEAD)
export PUSH_URL="$T/origin.git"

failures=0
ok() { echo "ok   $1"; }
ko() { echo "FAIL $1: $2"; failures=$((failures + 1)); }

# agent <branch> <file to change> : commits on a new branch from develop, then bundles it.
agent() {
  rm -rf "$T/agent" && git clone -q "$T/origin.git" "$T/agent" -b develop 2> /dev/null
  (cd "$T/agent" && git checkout -q -b "$1" && mkdir -p "$(dirname "$2")" && echo "$RANDOM" > "$2" &&
    git add -A && git commit -qm work && bash "$DIR/make-bundle.sh" "$1" "$BASE" "$T/work.bundle" > /dev/null)
}
# apply <branch> <mode> : in a fresh clone of develop, like the follow-up job.
apply() {
  rm -rf "$T/follow" && git clone -q "$T/origin.git" "$T/follow" -b develop 2> /dev/null
  (cd "$T/follow" && bash "$DIR/apply-bundle.sh" "$T/work.bundle" "$1" "$BASE" "$2")
}
expect_ok() { if out=$(apply "$2" "$3"); then ok "$1"; else ko "$1" "$out"; fi; }
expect_ko() {
  if out=$(apply "$2" "$3"); then ko "$1" "pushed"; elif [[ "$out" == *"$4"* ]]; then ok "$1"; else ko "$1" "$out"; fi
}

agent feature/9-x src/x.ts
expect_ok "new work branch is pushed" feature/9-x new
[ -n "$(git ls-remote "$T/origin.git" refs/heads/feature/9-x)" ] && ok "branch exists on origin" || ko "branch on origin" "missing"
expect_ko "same branch again (already exists)" feature/9-x new "existe déjà"
[ "$(git ls-remote "$T/origin.git" refs/heads/develop | cut -f1)" = "$BASE" ] && ok "develop untouched" || ko "develop" "moved"

agent develop src/y.ts
expect_ko "develop as target" develop new "ni feature"
agent main src/y.ts
expect_ko "main as target" main new "ni feature"

agent fix/workflow .github/workflows/x.yml
expect_ko "a .github/ change is refused" fix/workflow new ".github/"

agent feature/10-y src/y.ts
mv "$T/work.bundle" "$T/keep.bundle"
cp "$T/keep.bundle" "$T/work.bundle"
expect_ko "bundle branch name differs" feature/10-other new "ne contient pas"

# A fix on an existing branch: base = the PR's head; the remote must still be there.
(cd "$T/seed" && git checkout -q -b feature/11-z && echo z > z.txt && git add z.txt && git commit -qm z && git push -q origin feature/11-z)
PR_HEAD=$(git -C "$T/seed" rev-parse HEAD)
rm -rf "$T/agent" && git clone -q "$T/origin.git" "$T/agent" -b feature/11-z 2> /dev/null
(cd "$T/agent" && echo fix >> z.txt && git commit -qam fix && bash "$DIR/make-bundle.sh" feature/11-z "$PR_HEAD" "$T/work.bundle" > /dev/null)
if out=$(rm -rf "$T/follow" && git clone -q "$T/origin.git" "$T/follow" -b develop 2> /dev/null && cd "$T/follow" && bash "$DIR/apply-bundle.sh" "$T/work.bundle" feature/11-z "$PR_HEAD" existing); then
  ok "fix on the PR's branch is pushed"
else ko "fix on the PR's branch" "$out"; fi
if out=$(cd "$T/follow" && bash "$DIR/apply-bundle.sh" "$T/work.bundle" feature/11-z "$PR_HEAD" existing); then
  ko "remote moved" "pushed"
else [[ "$out" == *"a bougé"* ]] && ok "remote moved since the base is refused" || ko "remote moved" "$out"; fi

# Commits that do not descend from the base (agent rewrote history).
rm -rf "$T/agent" && git clone -q "$T/origin.git" "$T/agent" -b develop 2> /dev/null
(cd "$T/agent" && git checkout -q --orphan feature/12-o && git rm -rqf . && echo o > o.txt && git add o.txt && git commit -qm orphan &&
  git bundle create -q "$T/work.bundle" refs/heads/feature/12-o)
expect_ko "history not descending from the base" feature/12-o new "ne descendent pas"

[ "$failures" -eq 0 ] && echo "All tests passed" || { echo "$failures test(s) failed"; exit 1; }
