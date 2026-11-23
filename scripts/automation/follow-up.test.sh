#!/usr/bin/env bash
# Tests of issue-follow-up.sh with a fake gh (calls logged, nothing sent) and a throwaway
# origin: questions without bundle, PR without bundle, refused paths, the PR opened.
# Run: bash scripts/automation/follow-up.test.sh
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.com GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.com
mkdir -p "$T/bin" "$T/auto"
cat > "$T/bin/gh" << 'FAKE'
#!/usr/bin/env bash
{ printf 'GH %s\n' "$*"; [ -t 0 ] || cat; echo; } >> "$GH_LOG"
case "$1 $2" in
  "pr create") echo "https://github.com/o/r/pull/42" ;;
esac
exit 0
FAKE
chmod +x "$T/bin/gh"
git init -q --bare "$T/origin.git"
git clone -q "$T/origin.git" "$T/seed" 2> /dev/null
(cd "$T/seed" && git checkout -q -b develop && echo a > a.txt && git add a.txt && git commit -qm a && git push -q origin develop)
BASE=$(git -C "$T/seed" rev-parse HEAD)
export PATH="$T/bin:$PATH" PUSH_URL="$T/origin.git" AUTO="$T/auto" ISSUE=9 REPO=o/r OWNER=own RUN_URL=u BASE

failures=0
check() { if grep -qF -- "$2" "$GH_LOG"; then echo "ok   $1"; else echo "FAIL $1: « $2 » absent"; failures=$((failures + 1)); fi; }
check_not() { if grep -qF -- "$2" "$GH_LOG"; then echo "FAIL $1: « $2 » présent"; failures=$((failures + 1)); else echo "ok   $1"; fi; }
# run <name> <round> <json> [bundle]
run() {
  export GH_LOG="$T/$1.log" ROUND="$2" OUT="$3" BUNDLE="${4:-$T/none.bundle}"
  : > "$GH_LOG"
  (cd "$T/seed" && git checkout -q develop && bash "$DIR/issue-follow-up.sh" < /dev/null > "$T/$1.out" 2>&1)
}
bundle() {  # bundle <branch> <file> : one commit on a new branch from develop
  (cd "$T/seed" && git checkout -q develop && git checkout -q -B "$1" && mkdir -p "$(dirname "$2")" &&
    echo "$RANDOM" > "$2" && git add -A && git commit -qm w && bash "$DIR/make-bundle.sh" "$1" "$BASE" "$T/${1////-}.bundle" > /dev/null)
  echo "$T/${1////-}.bundle"
}

run questions 1 '{"status":"questions","comment":"5. Remise ? cc @someone"}'
check "questions without bundle: posted" "GH issue comment 9"
check_not "questions without bundle: not blocked" "bloqué"
check_not "questions: mention neutralized" "@someone"

run nobundle 1 '{"status":"pr","comment":"c","branch":"feature/9-x","title":"T","body":"B"}'
check "pr without commit: blocked" "labels[]=bloqué"
check "pr without commit: reason" "aucun commit"

b=$(bundle fix/agents .claude/agents/dev.md)
run reserved 1 '{"status":"pr","comment":"c","branch":"fix/agents","title":"T","body":"B"}' "$b"
check "pr touching .claude/: blocked" "session locale"
check_not "pr touching .claude/: no PR" "GH pr create"

b=$(bundle feature/9-x src/x.ts)
run pr 1 '{"status":"pr","comment":"Résumé","branch":"feature/9-x","title":"Remise, fixes #3","body":"Merci @someone. Closes #7","ui":false,"screens":""}' "$b"
check "pr: created as draft" "GH pr create --repo o/r --draft --base develop --head feature/9-x"
cat "$AUTO/pr-body.md" >> "$GH_LOG"  # the PR body goes through --body-file
check "pr: Closes of the workflow" "Closes #9"
check_not "pr: agent's mention neutralized" "@someone"
check_not "pr: agent's Closes neutralized" "Closes #7"
check_not "pr: title's fixes neutralized" "fixes #3"
check "pr: review loop started" "GH workflow run auto-pr.yml"
[ -n "$(git ls-remote "$T/origin.git" refs/heads/feature/9-x)" ] && echo "ok   pr: branch pushed" || { echo "FAIL pr: branch not pushed"; failures=$((failures + 1)); }

[ -n "${DEBUG:-}" ] && cat "$T"/*.out "$T"/*.log
[ "$failures" -eq 0 ] && echo "All tests passed" || { echo "$failures test(s) failed"; exit 1; }
