#!/usr/bin/env bash
# After the developer read the owner's answers (auto-issue.yml, D-060). Its structured output
# ($OUT) says what to do (decision in lib.mjs, followUpAction):
#   questions -> post only the missing questions as the next clarification round, or stop
#                ("bloqué") after 3 follow-ups;
#   pr        -> check the draft PR (bot author, feature/* or fix/* branch, develop and main
#                untouched), add the marker read by auto-pr.yml, move the issue to "en-cours"
#                and start the review loop if auto-pr.yml is on develop;
#   blocked   -> stop, with the developer's reason.
# Run from the trusted copy ($TRUSTED, setup.sh), never from the tree the agent changed.
# Env: OUT, ROUND (round of the last clarification), AUTO, ISSUE, REPO, OWNER, RUN_URL, GH_TOKEN.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cli() { node "$DIR/cli.mjs" "$@"; }

printf '%s' "$OUT" > "$AUTO/reply.json"
status=$(cli field "$AUTO/reply.json" status)
cli field "$AUTO/reply.json" comment > "$AUTO/reply.md"
cli follow-up "$status" "$ROUND" > "$AUTO/follow-up.json"
action=$(cli field "$AUTO/follow-up.json" action)

case "$action" in
  ask)
    cli clarification "$(cli field "$AUTO/follow-up.json" round)" "$AUTO/reply.md" > "$AUTO/comment.md"
    gh issue comment "$ISSUE" --repo "$REPO" --body-file "$AUTO/comment.md"
    ;;
  stop)
    bash "$DIR/block.sh" "$ISSUE" "3 relances de clarification sans réponse à tout (D-060). Questions encore ouvertes :

$(cat "$AUTO/reply.md")"
    ;;
  pr)
    # develop and main must not have moved during the run: the App only pushes work branches.
    git ls-remote origin refs/heads/develop refs/heads/main > "$AUTO/protected-after.txt"
    if ! cmp -s "$AUTO/protected-before.txt" "$AUTO/protected-after.txt"; then
      bash "$DIR/block.sh" "$ISSUE" "\`develop\` ou \`main\` a changé pendant le run : vérifier les derniers commits de ces branches avant toute suite."
      exit 0
    fi
    pr=$(cli field "$AUTO/reply.json" pr)
    gh pr view "$pr" --repo "$REPO" --json state,isDraft,baseRefName,headRefName,author,body,isCrossRepository > "$AUTO/pr.json"
    head=$(cli field "$AUTO/pr.json" headRefName)
    ok=$(node -e '
      const p = require(process.argv[1]);
      console.log(p.state === "OPEN" && p.isDraft && p.baseRefName === "develop" && p.author.is_bot && !p.isCrossRepository);
    ' "$AUTO/pr.json")
    if [ "$ok" != true ] || [ "$(cli work-branch "$head")" != true ]; then
      bash "$DIR/block.sh" "$ISSUE" "la PR #$pr annoncée par le développeur n'est pas un brouillon ouvert par l'automatisation depuis une branche \`feature/*\` ou \`fix/*\` vers \`develop\`."
      exit 0
    fi
    marker=$(cli pr-marker "$ISSUE" "$(cli field "$AUTO/reply.json" ui)" "$(cli field "$AUTO/reply.json" screens)")
    { cli field "$AUTO/pr.json" body; echo; echo "$marker"; } > "$AUTO/pr-body.md"
    gh pr edit "$pr" --repo "$REPO" --body-file "$AUTO/pr-body.md" > /dev/null
    bash "$DIR/labels.sh" "$ISSUE" -en-clarification +en-cours
    # auto-pr.yml arrives with a later PR of the automation: without it, say so (not "bloqué").
    has_loop=false
    if gh api "repos/$REPO/contents/.github/workflows/auto-pr.yml?ref=develop" > /dev/null 2>&1; then
      has_loop=true
      loop="La boucle de revue démarre (tech-lead, designer si l'interface est touchée, 2 tours de correction au plus)."
    else
      loop="ℹ️ La boucle de revue automatique (\`auto-pr.yml\`) n'est pas encore sur \`develop\` : la PR reste en brouillon, à relire à la main. Une fois le workflow sur \`develop\`, elle peut être lancée avec \`gh workflow run auto-pr.yml --ref develop -f pr=$pr -f step=review -f round=1\`."
    fi
    gh issue comment "$ISSUE" --repo "$REPO" --body-file - << BODY
🚧 PR #$pr ouverte en brouillon. $loop

$(cat "$AUTO/reply.md")
BODY
    if $has_loop; then
      gh workflow run auto-pr.yml --repo "$REPO" --ref develop -f pr="$pr" -f step=review -f round=1
    fi
    ;;
  blocked)
    bash "$DIR/block.sh" "$ISSUE" "$(cat "$AUTO/reply.md")"
    ;;
  *)
    echo "::error::Sortie inattendue du développeur (status « $status »)."
    exit 1
    ;;
esac
