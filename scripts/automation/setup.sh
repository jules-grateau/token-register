#!/usr/bin/env bash
# Common setup of an automation job (D-060), after actions/create-github-app-token and
# actions/checkout: commits are signed off by the App's bot, and every later step gets
#   AUTO = a work folder outside the checkout (raw data, agent outputs, comments to post),
#   INPUT = the only folder given to the agents (--add-dir): filtered thread or review, drafts,
#   BOT  = the bot's login, to recognise its own comments,
#   TRUSTED = a copy of scripts/automation/ taken now, from the trusted checkout (develop):
#             the steps after an agent run it, never the working tree the agent changed.
# Usage: bash scripts/automation/setup.sh <app slug>   Env: GH_TOKEN (App token).
set -euo pipefail

slug="${1:?app slug}"
bot="$slug[bot]"
id=$(gh api "users/$bot" --jq .id)
git config user.name "$bot"
git config user.email "$id+$bot@users.noreply.github.com"

auto="$RUNNER_TEMP/auto"
input="$RUNNER_TEMP/agent-input"
mkdir -p "$auto" "$input"
trusted="$RUNNER_TEMP/trusted-automation"
rm -rf "$trusted" && cp -r "$(cd "$(dirname "$0")" && pwd)" "$trusted"
{ echo "AUTO=$auto"; echo "INPUT=$input"; echo "BOT=$bot"; echo "TRUSTED=$trusted"; } >> "$GITHUB_ENV"
