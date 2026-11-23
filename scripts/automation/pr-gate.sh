#!/usr/bin/env bash
# First job of auto-pr.yml (D-060): may this run go on, and where does the PR stand?
# Goes on only when started by the owner or by the automation's bot, on an open draft PR to
# develop opened by the bot from a feature/* or fix/* branch of this repository, with the
# automation's marker, not "bloqué". Otherwise it says why and stops quietly: the owner may
# have taken the PR over.
# Writes to $GITHUB_OUTPUT: ok, issue, ui, screens, design (none|pending|ok|ko), head, sha.
# Env: GH_TOKEN, REPO, OWNER, BOT, AUTO, PR, STEP, ROUND, ACTOR.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cli() { node "$DIR/cli.mjs" "$@"; }
out() { echo "$1=$2" >> "$GITHUB_OUTPUT"; }
stop() { echo "::notice::$1"; out ok false; exit 0; }

[ "$ACTOR" = "$OWNER" ] || [ "$ACTOR" = "$BOT" ] || stop "Lancé par $ACTOR : seuls le propriétaire et l'automatisation lancent ce workflow."
[[ "$PR" =~ ^[0-9]+$ ]] || stop "Numéro de PR invalide : $PR"
[[ "$ROUND" =~ ^[1-9]$ ]] || stop "Tour invalide : $ROUND"
[ "$ROUND" -le "$(cli max-review-round)" ] || stop "Tour $ROUND au-delà du maximum."

gh pr view "$PR" --repo "$REPO" --json state,isDraft,baseRefName,body,labels,headRefName,headRefOid,author,isCrossRepository > "$AUTO/pr.json"
BOT="$BOT" node -e '
  const p = require(process.argv[1]);
  const fail = (why) => { console.log(why); process.exit(1); };
  const slug = process.env.BOT.slice(0, -"[bot]".length);
  if (!p.author.is_bot || ![slug, "app/" + slug, process.env.BOT].includes(p.author.login))
    fail("la PR n’a pas été ouverte par l’automatisation");
  if (p.isCrossRepository) fail("la PR vient d’un autre dépôt");
  if (p.state !== "OPEN") fail("la PR n’est pas ouverte");
  if (!p.isDraft) fail("la PR n’est plus en brouillon");
  if (p.baseRefName !== "develop") fail("la PR ne vise pas develop");
  if (p.labels.some((l) => l.name === "bloqué")) fail("la PR porte le label bloqué");
' "$AUTO/pr.json" > "$AUTO/why.txt" || stop "PR #$PR ignorée : $(cat "$AUTO/why.txt")."

cli field "$AUTO/pr.json" body > "$AUTO/pr-body.md"
marker=$(cli read-pr-marker "$AUTO/pr-body.md")
[ -n "$marker" ] || stop "PR #$PR ignorée : elle n'a pas le marqueur de l'automatisation."
head=$(cli field "$AUTO/pr.json" headRefName)
[ "$(cli work-branch "$head")" = true ] || stop "PR #$PR ignorée : sa branche n'est ni feature/* ni fix/*."
printf '%s' "$marker" > "$AUTO/marker.json"
ui=$(cli field "$AUTO/marker.json" ui)

gh api --paginate --slurp "repos/$REPO/issues/$PR/comments" > "$AUTO/comments.json"
out ok true
out issue "$(cli field "$AUTO/marker.json" issue)"
out ui "$ui"
out screens "$(cli field "$AUTO/marker.json" screens)"
out design "$(cli design-state "$AUTO/comments.json" "$BOT" "$ui")"
out head "$head"
out sha "$(cli field "$AUTO/pr.json" headRefOid)"
echo "PR #$PR, étape $STEP, tour $ROUND."
