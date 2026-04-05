#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[bytedoc]${NC} $*"; }
success() { echo -e "${GREEN}[bytedoc]${NC} $*"; }
warn()    { echo -e "${YELLOW}[bytedoc]${NC} $*"; }
error()   { echo -e "${RED}[bytedoc]${NC} $*"; }

usage() {
  echo "Usage: ./start-docker.sh <command> [options]"
  echo ""
  echo "Commands:"
  echo "  start          Build (if needed) and start ByteDoc"
  echo "  stop           Stop ByteDoc"
  echo ""
  echo "Options (start only):"
  echo "  --build, -b    Force rebuild of the image"
  echo "  --logs,  -l    Follow logs after start"
  echo "  --help,  -h    Show this help"
}

# ── Pre-flight checks ──────────────────────────────────────────────────────────

if ! command -v docker &>/dev/null; then
  error "Docker is required but not found."
  exit 1
fi

if ! docker compose version &>/dev/null 2>&1; then
  error "Docker Compose v2 is required."
  exit 1
fi

# ── Command dispatch ───────────────────────────────────────────────────────────

COMMAND="${1:-start}"
shift || true

case "$COMMAND" in

  start)
    BUILD=false
    FOLLOW=false

    for arg in "$@"; do
      case $arg in
        --build|-b) BUILD=true ;;
        --logs|-l)  FOLLOW=true ;;
        --help|-h)  usage; exit 0 ;;
        *) error "Unknown option: $arg"; echo ""; usage; exit 1 ;;
      esac
    done

    PORT="${PORT:-3019}"

    if [ "$BUILD" = true ]; then
      info "Building image..."
      docker compose build
    fi

    info "Starting ByteDoc..."
    docker compose up -d

    # Wait for nginx to respond
    info "Waiting for service to be ready..."
    for i in $(seq 1 20); do
      if curl -sf "http://localhost:${PORT}/" -o /dev/null 2>/dev/null; then
        break
      fi
      sleep 1
    done

    echo ""
    success "ByteDoc is running."
    echo ""
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps
    echo ""
    echo -e "  App  ${GREEN}http://localhost:${PORT}${NC}"
    echo ""
    echo -e "  Logs  ${YELLOW}docker compose logs -f${NC}"
    echo -e "  Stop  ${YELLOW}./start-docker.sh stop${NC}"
    echo ""

    if [ "$FOLLOW" = true ]; then
      info "Following logs (Ctrl+C to detach — container keeps running)..."
      echo ""
      exec docker compose logs -f
    fi
    ;;

  stop)
    info "Stopping ByteDoc..."
    docker compose down
    success "Stopped."
    ;;

  --help|-h|help)
    usage
    ;;

  *)
    error "Unknown command: $COMMAND"
    echo ""
    usage
    exit 1
    ;;
esac
