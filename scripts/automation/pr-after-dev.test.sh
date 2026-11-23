#!/usr/bin/env bash
# Tests of pr-after-dev.sh with a fake gh (calls logged, nothing sent) and a throwaway origin:
# no bundle, refused commits, a fix pushed and answered, a business question.
# Run: bash scripts/automation/pr-after-dev.test.sh
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.com GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.com
mkdir -p "$T/bin"
cat > "$T/bin/gh" << 'FAKE'
#!/usr/bin/env bash
{ printf 'GH %s\n' "$*"; [ -t 0 ] || cat; echo; } >> "$GH_LOG"
exit 0
FAKE
chmod +x "$T/bin/gh"
git init -q --bare "$T/origin.git"
git clone -q "$T/origin.git" "$T/seed" 2> /dev/null
(cd "$T/seed" && git checkout -q -b develop && echo a > a.txt && git add a.txt && git commit -qm a && git push -q origin develop &&
  git checkout -q -b feature/5-x && echo x > x.txt && git add x.txt && git commit -qm x && git push -q origin feature/5-x)
BASE=$(git -C "$T/seed" rev-parse HEAD)
export PATH="$T/bin:$PATH" GH_BIN="bash $T/bin/gh" PUSH_URL="$T/origin.git" REPO=o/r OWNER=own RUN_URL=u PR=5 ISSUE=3
export HEAD_BRANCH=feature/5-x BASE RESULT=success STEP=fix ROUND=1

failures=0
check() { if grep -qF -- "$2" "$GH_LOG"; then echo "ok   $1"; else echo "FAIL $1: « $2 » absent"; failures=$((failures + 1)); fi; }
check_not() { if grep -qF -- "$2" "$GH_LOG"; then echo "FAIL $1: « $2 » présent"; failures=$((failures + 1)); else echo "ok   $1"; fi; }
run() {  # run <name> <json> [bundle]
  export GH_LOG="$T/$1.log" OUT="$2" BUNDLE="${3:-$T/none.bundle}"
  : > "$GH_LOG"
  (cd "$T/seed" && bash "$DIR/pr-after-dev.sh" < /dev/null > "$T/$1.out" 2>&1)
}
bundle() {  # bundle <file> : one commit on the PR's branch, bundled from its head
  rm -rf "$T/agent" && git clone -q "$T/origin.git" "$T/agent" -b feature/5-x 2> /dev/null
  (cd "$T/agent" && mkdir -p "$(dirname "$1")" && echo "$RANDOM" > "$1" && git add -A && git commit -qm fix &&
    bash "$DIR/make-bundle.sh" feature/5-x "$BASE" "$T/fix.bundle" > /dev/null)
  echo "$T/fix.bundle"
}

run nobundle '{"status":"done","comment":"c","recap":"- ⏸️ TL-1","replies":[{"id":7,"body":"⏸️ hors périmètre"}]}'
check "no bundle: replies published" "GH api repos/o/r/pulls/5/comments/7/replies"
check "no bundle: recap published" "GH pr comment 5"
check "no bundle: next review" "-f step=review -f round=2"
check_not "no bundle: not blocked" "bloqué"

b=$(bundle .claude/agents/x.md)
run reserved '{"status":"done","comment":"c","recap":"r"}' "$b"
check "reserved path: blocked" "session locale"
check_not "reserved path: nothing published" "GH pr comment 5"

b=$(bundle src/fix.ts)
run fix '{"status":"done","comment":"c","recap":"- ✅ TL-1 cc @someone","replies":[{"id":7,"body":"✅"}]}' "$b"
check "fix: recap published" "GH pr comment 5"
check_not "fix: mention neutralized" "@someone"
check "fix: next review" "-f step=review -f round=2"
[ "$(git ls-remote "$T/origin.git" refs/heads/feature/5-x | cut -f1)" != "$BASE" ] && echo "ok   fix: pushed" || { echo "FAIL fix: not pushed"; failures=$((failures + 1)); }

export BASE=$(git ls-remote "$T/origin.git" refs/heads/feature/5-x | cut -f1)
run question '{"status":"questions","comment":"arrondi ?","recap":"- ❓ TL-2 arrondi"}'
check "question: recap published" "GH pr comment 5"
check "question: blocked" "choix métier"

RESULT=failure run failed '{}'
check "failed developer: blocked" "le développeur a échoué"

[ "$failures" -eq 0 ] && echo "All tests passed" || { echo "$failures test(s) failed"; exit 1; }
