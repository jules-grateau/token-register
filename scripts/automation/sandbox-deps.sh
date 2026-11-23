#!/usr/bin/env bash
# Prepares the runner for Claude Code's Bash sandbox (D-060), before any claude-code-action
# step that allows Bash: on Linux the sandbox needs bubblewrap and socat, and on Ubuntu 24.04
# AppArmor blocks the unprivileged user namespaces bwrap relies on. Without them every Bash
# command of the agent fails ("Sandbox is required but failed to initialize"). The sandbox
# stays on: this only installs what it needs.
# Usage: bash scripts/automation/sandbox-deps.sh
set -euo pipefail

# A flaky mirror should not block an agent: up to 3 tries.
for try in 1 2 3; do
  sudo apt-get update -q && break
  [ "$try" = 3 ] && exit 1
  sleep 10
done
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q --no-install-recommends bubblewrap socat

# The key only exists on kernels with this AppArmor restriction (Ubuntu 23.10+).
if [ -e /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]; then
  sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
fi

# Fail here, with a clear message, rather than in every Bash command of the agent.
if ! bwrap --ro-bind / / --dev /dev --proc /proc true; then
  echo "::error::bubblewrap ne peut pas créer de sandbox sur ce runner."
  exit 1
fi
