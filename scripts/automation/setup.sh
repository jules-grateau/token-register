#!/usr/bin/env bash
# Common setup of an automation job (D-060), after actions/create-github-app-token and
# actions/checkout: commits are signed off by the App's bot, and every later step gets
#   AUTO = a work folder outside the checkout (thread, agent outputs, comments to post),
#   BOT  = the bot's login, to recognise its own comments.
# Usage: bash scripts/automation/setup.sh <app slug>   Env: GH_TOKEN (App token).
set -euo pipefail

slug="${1:?app slug}"
bot="$slug[bot]"
id=$(gh api "users/$bot" --jq .id)
git config user.name "$bot"
git config user.email "$id+$bot@users.noreply.github.com"

auto="$RUNNER_TEMP/auto"
mkdir -p "$auto"
{ echo "AUTO=$auto"; echo "BOT=$bot"; } >> "$GITHUB_ENV"
