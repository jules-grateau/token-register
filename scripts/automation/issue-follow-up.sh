#!/usr/bin/env bash
# After the developer read the owner's answers (auto-issue.yml, D-060). Its structured output
# ($OUT) says what to do:
#   questions -> post only the missing questions as the next clarification round, or stop
#                ("bloqué") after 3 follow-ups;
#   pr        -> check the draft PR, add the marker read by auto-pr.yml, move the issue to
#                "en-cours" and start the review loop;
#   blocked   -> stop, with the developer's reason.
# Env: OUT, ROUND (round of the last clarification), AUTO, ISSUE, REPO, OWNER, RUN_URL, GH_TOKEN.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cli() { node "$DIR/cli.mjs" "$@"; }

printf '%s' "$OUT" > "$AUTO/reply.json"
status=$(cli field "$AUTO/reply.json" status)
cli field "$AUTO/reply.json" comment > "$AUTO/reply.md"

case "$status" in
  questions)
    next=$((ROUND + 1))
    if [ "$next" -gt "$(cli max-round)" ]; then
      bash "$DIR/block.sh" "$ISSUE" "3 relances de clarification sans réponse à tout (D-060). Questions encore ouvertes :

$(cat "$AUTO/reply.md")"
      exit 0
    fi
    cli clarification "$next" "$AUTO/reply.md" > "$AUTO/comment.md"
    gh issue comment "$ISSUE" --repo "$REPO" --body-file "$AUTO/comment.md"
    ;;
  pr)
    pr=$(cli field "$AUTO/reply.json" pr)
    gh pr view "$pr" --repo "$REPO" --json state,isDraft,baseRefName,author,body > "$AUTO/pr.json"
    ok=$(node -e '
      const p = require(process.argv[1]);
      console.log(p.state === "OPEN" && p.isDraft && p.baseRefName === "develop" && p.author.is_bot);
    ' "$AUTO/pr.json")
    if [ "$ok" != true ]; then
      bash "$DIR/block.sh" "$ISSUE" "la PR #$pr annoncée par le développeur n'est pas un brouillon ouvert par l'automatisation vers \`develop\`."
      exit 0
    fi
    marker=$(cli pr-marker "$ISSUE" "$(cli field "$AUTO/reply.json" ui)" "$(cli field "$AUTO/reply.json" screens)")
    { cli field "$AUTO/pr.json" body; echo; echo "$marker"; } > "$AUTO/pr-body.md"
    gh pr edit "$pr" --repo "$REPO" --body-file "$AUTO/pr-body.md" > /dev/null
    bash "$DIR/labels.sh" "$ISSUE" -en-clarification +en-cours
    gh issue comment "$ISSUE" --repo "$REPO" --body-file - << BODY
🚧 PR #$pr ouverte en brouillon. La boucle de revue démarre (tech-lead, designer si l'interface est touchée, 2 tours de correction au plus).

$(cat "$AUTO/reply.md")
BODY
    gh workflow run auto-pr.yml --repo "$REPO" --ref develop -f pr="$pr" -f step=review -f round=1
    ;;
  blocked)
    bash "$DIR/block.sh" "$ISSUE" "$(cat "$AUTO/reply.md")"
    ;;
  *)
    echo "::error::Sortie inattendue du développeur (status « $status »)."
    exit 1
    ;;
esac
