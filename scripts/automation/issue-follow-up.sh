#!/usr/bin/env bash
# After the developer read the owner's answers (auto-issue.yml, D-060). Its structured output
# ($OUT) says what to do (decision in lib.mjs, followUpAction):
#   questions -> post only the missing questions as the next clarification round, or stop
#                ("bloqué") after 3 follow-ups;
#   pr        -> check and push the developer's commits (apply-bundle.sh), open the draft
#                PR with the marker read by auto-pr.yml, move the issue to "en-cours" and
#                start the review loop if auto-pr.yml is on develop;
#   blocked   -> stop, with the developer's reason.
# Runs in its own job, on a checkout of develop: never in the tree the agent changed.
# Env: OUT, ROUND (round of the last clarification), BASE (develop's head when the agent
#      started), BUNDLE (its commits), AUTO, ISSUE, REPO, OWNER, RUN_URL, GH_TOKEN, PUSH_TOKEN.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cli() { node "$DIR/cli.mjs" "$@"; }

printf '%s' "$OUT" > "$AUTO/reply.json"
status=$(cli field "$AUTO/reply.json" status)
cli field "$AUTO/reply.json" comment | cli neutral - > "$AUTO/reply.md"
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
    # The agent did not push: its commits come as a bundle, checked then pushed here.
    branch=$(cli field "$AUTO/reply.json" branch)
    if ! why=$(bash "$DIR/apply-bundle.sh" "$BUNDLE" "$branch" "$BASE" new); then
      bash "$DIR/block.sh" "$ISSUE" "commits du développeur refusés : $why"
      exit 0
    fi
    title=$(cli field "$AUTO/reply.json" title | cli neutral -)
    [ -n "$title" ] || title="Issue #$ISSUE"
    marker=$(cli pr-marker "$ISSUE" "$(cli field "$AUTO/reply.json" ui)" "$(cli field "$AUTO/reply.json" screens)")
    {
      cli field "$AUTO/reply.json" body | cli neutral -
      # The issue closes at the release (D-060): the workflow's own keyword, the agent's are neutralized.
      echo
      echo "Closes #$ISSUE"
      echo
      echo "$marker"
    } > "$AUTO/pr-body.md"
    url=$(gh pr create --repo "$REPO" --draft --base develop --head "$branch" --title "$title" --body-file "$AUTO/pr-body.md")
    pr="${url##*/}"
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
