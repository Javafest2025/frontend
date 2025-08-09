# PowerShell script to execute Jest unit tests and Playwright e2e tests
# Usage:
#   .\scripts\run_tests.ps1 unit     # Run only unit tests
#   .\scripts\run_tests.ps1 e2e      # Run only e2e tests
#   .\scripts\run_tests.ps1          # Run all tests (unit + e2e)

# Default to running all tests if no argument is provided
$TestType = if ($args.Count -gt 0) { $args[0] } else { "all" }

function Run-UnitTests {
    Write-Host "Running unit tests..."
    npx jest --config tests/jest.config.ts $args
}

function Run-E2ETests {
    Write-Host "Running end-to-end tests..."
    npx playwright test --config tests/e2e/playwright.config.ts $args
}

switch ($TestType) {
    "unit" {
        Run-UnitTests
    }
    "e2e" {
        Run-E2ETests
    }
    "all" {
        Run-UnitTests
        Run-E2ETests
    }
    default {
        Write-Host "Unknown test type: $TestType"
        Write-Host "Usage: .\scripts\run_tests.ps1 [unit|e2e|all]"
        exit 1
    }
} 