#!/usr/bin/env bash
# Common setup of an automation job (D-060), after actions/create-github-app-token and
# actions/checkout: commits are signed off by the App's bot, and every later step gets
#   AUTO = a work folder outside the checkout (thread, agent outputs, comments to post),
#   BOT  = the bot's login, to recognise its own comments,
#   TRUSTED = a copy of scripts/automation/ taken now, from the trusted checkout (develop):
#             the steps after an agent run it, never the working tree the agent changed;
#   and $RUNNER_TEMP/trusted-claude = develop's .claude/ (see trusted-claude.sh).
# Usage: bash scripts/automation/setup.sh <app slug> [identity]   Env: GH_TOKEN (App token).
# With "identity", only sets the git identity (after checking out a PR, whose .claude/ must
# not be copied as the trusted one).
set -euo pipefail

slug="${1:?app slug}"
bot="$slug[bot]"
id=$(gh api "users/$bot" --jq .id)
git config user.name "$bot"
git config user.email "$id+$bot@users.noreply.github.com"
[ "${2:-}" = identity ] && exit 0

auto="$RUNNER_TEMP/auto"
mkdir -p "$auto"
trusted="$RUNNER_TEMP/trusted-automation"
rm -rf "$trusted" && cp -r "$(cd "$(dirname "$0")" && pwd)" "$trusted"
# The agents' instructions and Claude settings of develop, for jobs that check out a PR
# (trusted-claude.sh): a PR must not rewrite its own reviewers' rules or add hooks.
rm -rf "$RUNNER_TEMP/trusted-claude" && cp -r "$(cd "$(dirname "$0")/../.." && pwd)/.claude" "$RUNNER_TEMP/trusted-claude"
{ echo "AUTO=$auto"; echo "BOT=$bot"; echo "TRUSTED=$trusted"; } >> "$GITHUB_ENV"
