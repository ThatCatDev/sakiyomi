#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}==>${NC} $1"; }
print_error() { echo -e "${RED}Error:${NC} $1"; }

show_help() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  start     Start Supabase locally"
  echo "  stop      Stop Supabase"
  echo "  test      Run e2e tests against local Supabase"
  echo "  reset     Reset database"
  echo ""
  echo "Services (after start):"
  echo "  App:      http://localhost:4321"
  echo "  Supabase: http://localhost:54321"
  echo "  Inbucket: http://localhost:54324 (email testing)"
}

check_supabase() {
  if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found"
    echo "Install: brew install supabase/tap/supabase"
    exit 1
  fi
}

start_supabase() {
  check_supabase
  if supabase status &> /dev/null; then
    print_status "Supabase already running"
  else
    print_status "Starting Supabase..."
    supabase start
  fi
  echo ""
  echo "Inbucket (email testing): http://localhost:54324"
}

run_tests() {
  check_supabase

  # Ensure Supabase is running
  if ! supabase status &> /dev/null; then
    print_status "Starting Supabase..."
    supabase start
  fi

  print_status "Running e2e tests..."
  bun run test:e2e
}

case "${1:-}" in
  start) start_supabase ;;
  stop) check_supabase && supabase stop ;;
  test) run_tests ;;
  reset) check_supabase && supabase db reset ;;
  *) show_help ;;
esac
