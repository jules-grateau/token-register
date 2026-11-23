#!/usr/bin/env bash
# Keeps only what a capture run should produce (D-060): .png, .json and .md files, regular
# files of 2 MB at most, 500 files at most. The captures come from a job that ran the PR's
# code: nothing else is published nor shown to the designer.
# Usage: bash scripts/automation/filter-captures.sh <from> <to>
set -euo pipefail

from="${1:?from}"
to="${2:?to}"
max_size=$((2 * 1024 * 1024))
max_files=500
mkdir -p "$to"
kept=0
skipped=0
while IFS= read -r -d '' file; do
  rel="${file#"$from"/}"
  size=$(wc -c < "$file")
  if [[ ! "$rel" =~ ^[A-Za-z0-9._/-]+\.(png|json|md)$ ]] || [[ "$rel" == *..* ]] ||
    [ "$size" -gt "$max_size" ] || [ "$kept" -ge "$max_files" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  mkdir -p "$to/$(dirname "$rel")"
  cp "$file" "$to/$rel"
  kept=$((kept + 1))
done < <(find "$from" -type f -print0 | sort -z)
echo "Captures gardées : $kept, écartées : $skipped."
[ "$skipped" -eq 0 ] || echo "::warning::$skipped fichier(s) de captures écarté(s) (type, taille ou nombre)."
