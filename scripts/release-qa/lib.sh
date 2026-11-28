#!/usr/bin/env bash
# Helpers for the release QA (D-058), sourced by run.sh and by every scenario in scenarios/.
# Each instance is a throwaway container of the image under test ($QA_IMAGE) with its own
# Docker volume, on 127.0.0.1 only. Nothing here talks to the demo or to production.
#
# Env: QA_IMAGE (default token-register:qa), QA_RESULTS (file where checks are recorded,
#      set by run.sh), INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD (throwaway first admin of
#      every instance, D-063: generated here or by the workflow when not set, never printed).
#      The API is called with a session cookie (curl cookie jar, one per port) opened by
#      qa_wait_up; the instances run with COOKIE_SECURE=false (local HTTP).
#
# Can also be run directly to start or stop an instance (used by release-qa.yml for the
# screens): bash lib.sh start <name> <TOKEN|EUR> <port> | bash lib.sh cleanup

# Git Bash on Windows would rewrite /data/... arguments into Windows paths.
# Side effect: never pass /dev/null as an argument there (curl -o /dev/null), redirect instead.
export MSYS_NO_PATHCONV=1

QA_IMAGE="${QA_IMAGE:-token-register:qa}"
QA_LABEL=token-register-release-qa
QA_DB=/data/database.sqlite
export INITIAL_ADMIN_USERNAME="${INITIAL_ADMIN_USERNAME:-qa-admin}"
export INITIAL_ADMIN_PASSWORD="${INITIAL_ADMIN_PASSWORD:-qa-$RANDOM$RANDOM$RANDOM}"
# Cookie jars of the sessions, one file per port (qa_jar).
QA_COOKIES="${QA_COOKIES:-$(mktemp -d)}"
export QA_COOKIES

# --- Results -------------------------------------------------------------------------------

# qa_ok <description> / qa_ko <description> <detail>: one line per check in $QA_RESULTS.
qa_ok() { printf 'OK\t%s\t%s\n' "${QA_SCENARIO:-?}" "$1" >> "${QA_RESULTS:-/dev/stdout}"; echo "  ok  $1"; }
qa_ko() {
  # Detail on one line: it goes into a PR comment (release-qa.yml).
  local detail; detail=$(printf '%s' "${2:-}" | tr '\n\r\t' '   ' | cut -c1-300)
  printf 'KO\t%s\t%s\t%s\n' "${QA_SCENARIO:-?}" "$1" "$detail" >> "${QA_RESULTS:-/dev/stdout}"
  echo "  KO  $1 ($detail)"
}

# qa_expect <description> <actual> <expected>
qa_expect() {
  if [ "$2" = "$3" ]; then qa_ok "$1"; else qa_ko "$1" "obtenu « $2 », attendu « $3 »"; fi
}

# qa_expect_contains <description> <text> <expected substring>
qa_expect_contains() {
  if [[ "$2" == *"$3"* ]]; then qa_ok "$1"; else qa_ko "$1" "« $3 » absent de : $(printf '%s' "$2" | tail -c 200)"; fi
}

# qa_succeeds <description> <command...>: the command exits 0 (its output is the detail if not).
qa_succeeds() {
  local desc="$1" output; shift
  if output=$("$@" 2>&1); then qa_ok "$desc"; else qa_ko "$desc" "code $? : $(printf '%s' "$output" | tail -c 200)"; fi
}

# --- Instances -----------------------------------------------------------------------------

# qa_start <name> <currency> <port> [extra docker run args...]: starts a container on the
# volume <name>-data (created empty on first use: a new database, D-055). The first admin comes
# from INITIAL_ADMIN_* (empty values: no admin, the start is refused, D-063).
# QA_COOKIE_SECURE=true keeps the Secure flag of the session cookie (scenario 08).
qa_start() {
  local name="$1" currency="$2" port="$3"; shift 3
  docker rm -f "$name" > /dev/null 2>&1
  docker volume create --label "$QA_LABEL" "$name-data" > /dev/null
  docker run -d --name "$name" --label "$QA_LABEL" \
    -p "127.0.0.1:$port:3000" -v "$name-data:/data" \
    -e NODE_ENV=production -e PORT=3000 -e DATABASE_PATH="$QA_DB" -e LOG_LEVEL=info \
    -e INITIAL_ADMIN_USERNAME -e INITIAL_ADMIN_PASSWORD -e CURRENCY="$currency" \
    -e COOKIE_SECURE="${QA_COOKIE_SECURE:-false}" \
    -e FRONTEND_URL="http://localhost:$port" -e RUNTIME_VITE_BASE_API_URL="http://localhost:$port/api" \
    "$@" "$QA_IMAGE" > /dev/null
}

# qa_jar <port>: cookie jar of the session on that port.
qa_jar() { printf '%s/cookies-%s.txt' "$QA_COOKIES" "$1"; }

# qa_login <port> [username] [password] [jar]: opens a session, prints the HTTP code. Defaults:
# the first admin, the jar of the port. The body is built from the environment and sent on
# stdin: the password never appears on a command line, nor in the output.
qa_login() {
  local port="$1" user="${2:-$INITIAL_ADMIN_USERNAME}" pass="${3:-$INITIAL_ADMIN_PASSWORD}"
  local jar="${4:-$(qa_jar "$1")}"
  QA_USER="$user" QA_PASS="$pass" node -e \
    'process.stdout.write(JSON.stringify({ username: process.env.QA_USER, password: process.env.QA_PASS }))' |
    curl -sS -o "$QA_COOKIES/login-body.txt" -D "$QA_COOKIES/login-headers.txt" -w '%{http_code}' \
      -c "$jar" -H 'Content-Type: application/json' --data-binary @- \
      "http://localhost:$port/api/auth/login"
}

# qa_wait_up <name> <port>: 0 once the API answers and the first admin is logged in (session in
# the jar of the port), 1 if the container stopped or timed out.
qa_wait_up() {
  local name="$1" port="$2" _
  for _ in $(seq 1 90); do
    if [ "$(qa_login "$port" 2> /dev/null)" = 200 ]; then
      return 0
    fi
    [ "$(docker inspect -f '{{.State.Running}}' "$name" 2> /dev/null)" = true ] || return 1
    sleep 1
  done
  return 1
}

# qa_wait_exit <name>: prints the exit code once the container stopped ("running" after 90 s).
qa_wait_exit() {
  local name="$1" _
  for _ in $(seq 1 90); do
    if [ "$(docker inspect -f '{{.State.Running}}' "$1" 2> /dev/null)" != true ]; then
      docker inspect -f '{{.State.ExitCode}}' "$name"; return
    fi
    sleep 1
  done
  echo running
}

# qa_logs <name>: last lines of the container output (throwaway instance; the API never logs a
# password nor a session cookie, D-063).
qa_logs() { docker logs --tail 15 "$1" 2>&1; }

qa_stop() { docker stop -t 5 "$1" > /dev/null 2>&1; docker rm -f "$1" > /dev/null 2>&1; }

# qa_admin <volume> <currency> <command...>: runs a command of the image on that volume, like
# the admin commands of deploy/README.md (--entrypoint "": no startup migration). Passes
# INITIAL_ADMIN_* (the migration of a database without account creates the first admin) and
# RESET_ADMIN_PASSWORD (reset-admin-password; empty when not set).
qa_admin() {
  local volume="$1" currency="$2"; shift 2
  docker run --rm --label "$QA_LABEL" --entrypoint "" -v "$volume:/data" \
    -e NODE_ENV=production -e DATABASE_PATH="$QA_DB" -e LOG_LEVEL=warn -e CURRENCY="$currency" \
    -e INITIAL_ADMIN_USERNAME -e INITIAL_ADMIN_PASSWORD -e RESET_ADMIN_PASSWORD \
    "$QA_IMAGE" "$@" 2>&1
}

# qa_sql <volume> <sql>: runs one statement on the database of that volume, prints the rows
# as JSON (to set up a case the app cannot create, or to read what it wrote).
qa_sql() {
  docker run --rm --label "$QA_LABEL" --entrypoint "" -v "$1:/data" -e QA_SQL="$2" "$QA_IMAGE" \
    node -e '
      const sqlite3 = require("sqlite3");
      const db = new sqlite3.Database(process.argv[1]);
      db.all(process.env.QA_SQL, (err, rows) => {
        if (err) { console.error(err.message); process.exit(1); }
        console.log(JSON.stringify(rows));
        db.close();
      });' "$QA_DB"
}

# Removes every container and volume created by the QA (also run before, after a crash), and
# the session cookies.
# shellcheck disable=SC2086
qa_cleanup() {
  local ids  # one id per word: split on purpose
  ids=$(docker ps -aq --filter "label=$QA_LABEL"); [ -n "$ids" ] && docker rm -f $ids > /dev/null
  ids=$(docker volume ls -q --filter "label=$QA_LABEL"); [ -n "$ids" ] && docker volume rm -f $ids > /dev/null
  rm -f "$QA_COOKIES"/*.txt 2> /dev/null
  return 0
}

# --- API -----------------------------------------------------------------------------------

# qa_api <port> <METHOD> <route> [json body]: prints the response body, fails on HTTP >= 400.
# With the session of the port (qa_wait_up / qa_login).
qa_api() {
  local port="$1" method="$2" route="$3" body="${4:-}"
  local args=(-fsS -b "$(qa_jar "$port")" -X "$method")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  curl "${args[@]}" "http://localhost:$port/api$route"
}

# qa_status <port> <METHOD> <route> [json body] [jar]: prints « <body> <HTTP code> », without
# failing on 4xx. Jar: the session of the port by default, "none" to send no cookie.
qa_status() {
  local port="$1" method="$2" route="$3" body="${4:-}" jar="${5:-$(qa_jar "$1")}"
  local args=(-sS -X "$method" -w ' %{http_code}')
  [ "$jar" != none ] && args+=(-b "$jar")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  curl "${args[@]}" "http://localhost:$port/api$route"
}

# qa_json '<js expression on d>': reads JSON on stdin, prints the expression's value (strings
# unquoted). Example: qa_api 3101 GET /categories | qa_json 'd.length'
qa_json() {
  node -e '
    let s = "";
    process.stdin.on("data", (c) => (s += c)).on("end", () => {
      const d = JSON.parse(s || "null");
      const v = eval(process.argv[1]);
      console.log(typeof v === "string" ? v : JSON.stringify(v));
    });' "$1"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  case "${1:-}" in
    start)
      shift
      qa_start "$@" || exit 1
      if ! qa_wait_up "$1" "$3"; then echo "::error::L'instance $1 ne démarre pas."; qa_logs "$1"; exit 1; fi
      ;;
    cleanup) qa_cleanup ;;
    *) echo "Usage: bash lib.sh start <name> <TOKEN|EUR> <port> | cleanup" >&2; exit 2 ;;
  esac
fi
