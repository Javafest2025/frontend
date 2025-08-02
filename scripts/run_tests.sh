#!/usr/bin/env bash
# Helper script to execute Jest unit tests and Playwright e2e tests
# Usage:
#   ./scripts/run_tests.sh unit     # Run only unit tests
#   ./scripts/run_tests.sh e2e      # Run only e2e tests
#   ./scripts/run_tests.sh ui       # Run e2e tests in UI mode
#   ./scripts/run_tests.sh          # Run all tests (unit + e2e)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

# Default to running all tests if no argument is provided
TEST_TYPE="${1:-all}"

run_unit_tests() {
  echo "Running unit tests..."
  npx jest --config tests/jest.config.ts "$@"
}

run_e2e_tests() {
  echo "Running end-to-end tests..."
  npx playwright test --config tests/e2e/playwright.config.ts "$@"
}

run_e2e_tests_ui() {
  echo "Running end-to-end tests in UI mode..."
  npx playwright test --ui --config tests/e2e/playwright.config.ts "$@"
}

case "$TEST_TYPE" in
  "unit")
    run_unit_tests "${@:2}"
    ;;
  "e2e")
    run_e2e_tests "${@:2}"
    ;;
  "ui")
    run_e2e_tests_ui "${@:2}"
    ;;
  "all")
    run_unit_tests
    run_e2e_tests
    ;;
  *)
    echo "Unknown test type: $TEST_TYPE"
    echo "Usage: ./scripts/run_tests.sh [unit|e2e|ui|all]"
    exit 1
    ;;
esac 