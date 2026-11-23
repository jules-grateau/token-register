#!/usr/bin/env bash
# Packs the developer's local commits as a git bundle (D-060): the agent never pushes, its
# commits leave the job as this file, checked and pushed by apply-bundle.sh in a job that
# starts from develop. Run by the workflow after the agent, in the job without write token.
# Usage: bash make-bundle.sh <branch> <base sha> <out file>
set -euo pipefail

branch="${1:?branch}"
base="${2:?base}"
out="${3:?out file}"
git rev-parse -q --verify "refs/heads/$branch^{commit}" > /dev/null || {
  echo "::error::Branche locale « $branch » introuvable."; exit 1; }
count=$(git rev-list --count "$base..refs/heads/$branch")
if [ "$count" -eq 0 ]; then
  echo "Aucun commit sur « $branch » depuis la base : pas de bundle."
  exit 0
fi
git bundle create -q "$out" "refs/heads/$branch" "^$base"
echo "$count commit(s) de « $branch » empaquetés."
