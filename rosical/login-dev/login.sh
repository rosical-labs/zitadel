#!/usr/bin/env bash
# Local test of our login build against the rosical-iam stack (`just dev`).
# Usage: ./login.sh seed | build | start | rp | totp | stop
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(git -C "$DIR" rev-parse --show-toplevel)"
LOGS="$DIR/logs"
SEED_OUT="$DIR/seed.out.env"
API_CONTAINER=rosical-iam-local-zitadel-api-1
LOGIN_CONTAINER=rosical-iam-local-zitadel-login-1
mkdir -p "$LOGS"

die() { echo "error: $*" >&2; exit 1; }

# container_env CONTAINER VAR -> value of VAR in the stack container's config (docker inspect: the API image has no shell).
container_env() {
  local env value
  env="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$1" 2>/dev/null)" \
    || die "container $1 not found; is the rosical-iam stack running? Start it with 'just dev' in rosical-iam."
  [ "$(docker inspect --format '{{.State.Running}}' "$1")" = true ] \
    || die "container $1 is not running; start the stack with 'just dev' in rosical-iam."
  value="$(sed -n "s/^$2=//p" <<<"$env")"
  [ -n "$value" ] || die "$2 is not set in container $1."
  printf '%s' "$value"
}

# seed_value NAME -> value of NAME from seed.out.env, quotes stripped.
seed_value() {
  [ -f "$SEED_OUT" ] || die "$SEED_OUT missing; run '$0 seed' first."
  local value
  value="$(sed -n "s/^$1=//p" "$SEED_OUT" | sed "s/^'//; s/'\$//")"
  [ -n "$value" ] || die "$1 missing in $SEED_OUT; re-run '$0 seed'."
  printf '%s' "$value"
}

case "${1:-}" in
  seed)
    # Separate assignments so a failed lookup stops the script (set -e ignores failures in command prefixes).
    LOGIN_CLIENT_PRIVATE_KEY="$(container_env "$LOGIN_CONTAINER" SYSTEM_USER_PRIVATE_KEY)"
    LOGIN_CLIENT_USER_ID="$(container_env "$LOGIN_CONTAINER" SYSTEM_USER_ID)"
    ADMIN_LOGIN_NAME="$(container_env "$API_CONTAINER" ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME)"
    ADMIN_PASSWORD="$(container_env "$API_CONTAINER" ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD)"
    export LOGIN_CLIENT_PRIVATE_KEY LOGIN_CLIENT_USER_ID ADMIN_LOGIN_NAME ADMIN_PASSWORD
    node "$DIR/seed.cjs"
    ;;
  build)
    cd "$REPO"
    # Nx spawns `pnpm` itself; pnpm is only available through corepack here.
    export PATH="$DIR/bin:$PATH"
    pnpm nx run @zitadel/login:build --skip-nx-cache
    echo "Built. Run: $0 stop && $0 start"
    ;;
  start)
    key="$(container_env "$LOGIN_CONTAINER" SYSTEM_USER_PRIVATE_KEY)"
    user_id="$(container_env "$LOGIN_CONTAINER" SYSTEM_USER_ID)"
    product_clients=""
    if [ -f "$SEED_OUT" ]; then
      product_clients="$(seed_value DIGISAT_PRODUCT_CLIENTS)"
    else
      echo "note: $SEED_OUT missing, starting without DIGISAT_PRODUCT_CLIENTS (run '$0 seed' to create it)." >&2
    fi
    standalone="$REPO/apps/login/.next/standalone/apps/login"
    [ -f "$standalone/server.js" ] || die "no build at $standalone; run '$0 build' first."
    (cd "$standalone" && \
      SYSTEM_USER_PRIVATE_KEY="$key" SYSTEM_USER_ID="$user_id" AUDIENCE=http://localhost:8082 \
      ZITADEL_API_URL=http://localhost:8082 CUSTOM_REQUEST_HEADERS=X-Forwarded-Proto:http \
      DIGISAT_PRODUCT_CLIENTS="$product_clients" \
      PORT=3100 HOSTNAME=127.0.0.1 nohup node server.js >"$LOGS/login.log" 2>&1 &)
    nohup node "$DIR/proxy.cjs" >"$LOGS/proxy.log" 2>&1 &
    echo "Open http://localhost:3200/ui/v2/login/loginname  (logs: $LOGS)"
    ;;
  rp)
    [ -f "$SEED_OUT" ] || die "$SEED_OUT missing; run '$0 seed' first."
    nohup node "$DIR/rp.cjs" >"$LOGS/rp.log" 2>&1 &
    echo "Open http://localhost:4001 (endpoint control) or http://localhost:4002 (hub)  (log: $LOGS/rp.log)"
    ;;
  totp)
    node "$DIR/totp.cjs" "$(seed_value ALICE_TOTP_SECRET)"
    ;;
  stop)
    # Kill by listening port, so the pattern can't match this shell.
    for port in 3100 3200 4001 4002; do
      for pid in $(ss -ltnpH "sport = :$port" | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u); do
        kill "$pid"
      done
    done
    echo "Stopped."
    ;;
  *) echo "Usage: $0 seed | build | start | rp | totp | stop" >&2; exit 1 ;;
esac
