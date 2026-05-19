#!/usr/bin/env bash
set -euo pipefail

# start-easystock.sh
# Starts both the frontend and backend in the workspace.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR"
BACKEND_DIR="$(cd "$ROOT_DIR/../easystock-backend" && pwd)"
LOG_DIR="$ROOT_DIR/.easystock-logs"

mkdir -p "$LOG_DIR"

check_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "'$1' not found. Please install it (pnpm)." >&2; exit 1; }
}

check_cmd pnpm

start_service() {
  name="$1"
  dir="$2"
  cmd="$3"
  logfile="$4"
  pidfile="$5"

  echo "Starting $name..."
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "$name already running (pid $(cat "$pidfile")). Skipping."
    return
  fi

  nohup bash -lc "cd '$dir' && $cmd" > "$logfile" 2>&1 &
  echo $! > "$pidfile"
  echo "$name started, pid $(cat "$pidfile"), log: $logfile"
}

start_service "backend" "$BACKEND_DIR" "pnpm dev" "$LOG_DIR/backend.log" "$LOG_DIR/backend.pid"
start_service "frontend" "$FRONTEND_DIR" "pnpm dev" "$LOG_DIR/frontend.log" "$LOG_DIR/frontend.pid"

echo "Tailing logs (backend then frontend). Press Ctrl-C to stop."
tail -n +1 -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
