#!/bin/bash

# PrompTab Backend Test Runner
# Usage: ./scripts/run_tests.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
COVERAGE=true
VERBOSE=false
PARALLEL=false
FAIL_FAST=false

# Function to print usage
print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE     Test type: all, unit, integration, api, auth, models"
    echo "  -c, --coverage      Enable coverage reporting (default: true)"
    echo "  -v, --verbose       Verbose output"
    echo "  -p, --parallel      Run tests in parallel"
    echo "  -f, --fail-fast     Stop on first failure"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests with coverage"
    echo "  $0 -t unit           # Run only unit tests"
    echo "  $0 -t api -v         # Run API tests with verbose output"
    echo "  $0 -t all -p -f      # Run all tests in parallel, fail fast"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -f|--fail-fast)
            FAIL_FAST=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're in the right directory
check_directory() {
    if [[ ! -f "pyproject.toml" ]] && [[ ! -f "requirements.txt" ]]; then
        print_error "Please run this script from the backend directory"
        exit 1
    fi
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed"
        exit 1
    fi
    
    if ! command -v pytest &> /dev/null; then
        print_warning "pytest not found, installing..."
        pip install pytest pytest-asyncio pytest-cov pytest-mock httpx
    fi
    
    print_success "Dependencies check completed"
}

# Function to build pytest command
build_pytest_command() {
    local cmd="pytest"
    
    # Add test type filter
    case $TEST_TYPE in
        "unit")
            cmd="$cmd -m unit"
            ;;
        "integration")
            cmd="$cmd -m integration"
            ;;
        "api")
            cmd="$cmd -m api"
            ;;
        "auth")
            cmd="$cmd -m auth"
            ;;
        "models")
            cmd="$cmd -m models"
            ;;
        "all")
            # No filter for all tests
            ;;
        *)
            print_error "Invalid test type: $TEST_TYPE"
            exit 1
            ;;
    esac
    
    # Add coverage options
    if [[ "$COVERAGE" == true ]]; then
        cmd="$cmd --cov=app --cov-report=term-missing --cov-report=html:htmlcov --cov-fail-under=80"
    fi
    
    # Add verbose option
    if [[ "$VERBOSE" == true ]]; then
        cmd="$cmd -v -s"
    fi
    
    # Add parallel option
    if [[ "$PARALLEL" == true ]]; then
        cmd="$cmd -n auto"
    fi
    
    # Add fail fast option
    if [[ "$FAIL_FAST" == true ]]; then
        cmd="$cmd -x"
    fi
    
    echo "$cmd"
}

# Function to run tests
run_tests() {
    local pytest_cmd=$(build_pytest_command)
    
    print_status "Running $TEST_TYPE tests..."
    print_status "Command: $pytest_cmd"
    echo ""
    
    # Set environment variables for testing
    export TESTING=true
    export DATABASE_URL="sqlite+aiosqlite:///:memory:"
    
    # Run tests
    if eval "$pytest_cmd"; then
        print_success "All tests passed!"
        
        if [[ "$COVERAGE" == true ]]; then
            print_status "Coverage report generated in htmlcov/index.html"
        fi
        
        return 0
    else
        print_error "Some tests failed!"
        return 1
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Remove coverage files
    if [[ -d "htmlcov" ]]; then
        rm -rf htmlcov
    fi
    
    if [[ -f ".coverage" ]]; then
        rm .coverage
    fi
    
    if [[ -f "coverage.xml" ]]; then
        rm coverage.xml
    fi
    
    # Remove cache
    if [[ -d ".pytest_cache" ]]; then
        rm -rf .pytest_cache
    fi
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting PrompTab Backend Test Runner"
    echo ""
    
    # Check directory
    check_directory
    
    # Check dependencies
    check_dependencies
    
    # Clean up before running tests
    cleanup
    
    # Run tests
    if run_tests; then
        print_success "Test execution completed successfully!"
        exit 0
    else
        print_error "Test execution failed!"
        exit 1
    fi
}

# Run main function
main "$@" 