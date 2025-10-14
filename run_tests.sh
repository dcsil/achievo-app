#!/bin/bash

# Achievo App - API Test Runner
# Run this script to execute API tests

echo "🧪 Achievo App - API Test Suite"
echo "================================"
echo ""

# Parse command line arguments
TEST_SUITE="${1:-all}"

# Check if backend is running
echo "Checking if backend server is running..."
if curl -s http://127.0.0.1:5000/db/users > /dev/null 2>&1; then
    echo "✓ Backend server is running on http://127.0.0.1:5000"
    echo ""
else
    echo "✗ Backend server is not running!"
    echo ""
    echo "Please start the backend server first:"
    echo "  cd backend/app"
    echo "  python main.py"
    echo ""
    exit 1
fi

# Check if requests library is installed
echo "Checking dependencies..."
if python3 -c "import requests" 2>/dev/null; then
    echo "✓ Dependencies are installed"
    echo ""
else
    echo "✗ 'requests' library not found!"
    echo ""
    echo "Installing dependencies..."
    pip3 install -r tests/requirements.txt
    echo ""
fi

# Run the tests based on the suite parameter
exit_code=0

if [ "$TEST_SUITE" = "users" ] || [ "$TEST_SUITE" = "all" ]; then
    echo "Running User API tests..."
    echo ""
    cd tests && python3 test_users_api.py
    user_exit=$?
    exit_code=$((exit_code + user_exit))
    cd ..
    echo ""
fi

if [ "$TEST_SUITE" = "tasks" ] || [ "$TEST_SUITE" = "all" ]; then
    echo "Running Task API tests..."
    echo ""
    cd tests && python3 test_tasks_api.py
    task_exit=$?
    exit_code=$((exit_code + task_exit))
    cd ..
    echo ""
fi

if [ "$TEST_SUITE" = "blindbox" ] || [ "$TEST_SUITE" = "all" ]; then
    echo "Running Blind Box API tests..."
    echo ""
    cd tests && python3 test_blindbox_api.py
    blindbox_exit=$?
    exit_code=$((exit_code + blindbox_exit))
    cd ..
    echo ""
fi

# Show usage if invalid parameter
if [ "$TEST_SUITE" != "all" ] && [ "$TEST_SUITE" != "users" ] && [ "$TEST_SUITE" != "tasks" ] && [ "$TEST_SUITE" != "blindbox" ]; then
    echo "Usage: ./run_tests.sh [all|users|tasks|blindbox]"
    echo "  all      - Run all test suites (default)"
    echo "  users    - Run only user API tests"
    echo "  tasks    - Run only task API tests"
    echo "  blindbox - Run only blind box API tests"
    echo ""
    exit 1
fi

# Final summary
echo ""
if [ $exit_code -eq 0 ]; then
    echo "✓ All tests passed!"
else
    echo "✗ Some tests failed. See output above for details."
fi

exit $exit_code
