# Achievo App - API Testing Suite

This directory contains tests for the Achievo App backend APIs.

## Setup

1. Install test dependencies:
```bash
pip install -r tests/requirements.txt
```

## Running Tests

### Prerequisites
- Backend server must be running on `http://127.0.0.1:5000`
- Start the backend with:
  ```bash
  cd backend/app
  python main.py
  ```

### Run Tests with Test Runner Script (Recommended)

```bash
chmod +x run_tests.sh

# Run all tests
./run_tests.sh

# Run only user API tests
./run_tests.sh users

# Run only task API tests
./run_tests.sh tasks

# Run only blind box API tests
./run_tests.sh blindbox
```

### Run Tests Directly

**User API Tests:**
```bash
cd tests
python3 test_users_api.py
```

**Task API Tests:**
```bash
cd tests
python3 test_tasks_api.py
```

**Blind Box API Tests:**
```bash
cd tests
python3 test_blindbox_api.py
```

## Available Test Suites

### User API Tests (`test_users_api.py`)
Tests for `/db/users` endpoints:
- ✓ GET `/db/users` - Fetch all users
- ✓ POST `/db/users` - Create new user
- ✓ POST `/db/users` - Validation (missing required fields)
- ✓ GET `/db/users?user_id=X` - Fetch specific user
- ✓ GET `/db/users?user_id=X` - Non-existent user (404)

### Task API Tests (`test_tasks_api.py`)
Tests for `/db/tasks` endpoints:
- ✓ POST `/db/tasks` - Create new task
- ✓ POST `/db/tasks` - Validation (missing required fields: task_id, user_id, description, type)
- ✓ GET `/db/tasks?user_id=X` - Fetch tasks for a user
- ✓ GET `/db/tasks` - Validation (missing user_id)
- ✓ GET `/db/tasks?user_id=X&assignment_id=Y` - Fetch tasks with filters
- ✓ PUT `/db/tasks/<task_id>` - Update task
- ✓ PUT `/db/tasks/<task_id>` - Validation (no fields to update)
- ✓ POST `/db/tasks/<task_id>/complete` - Complete task (without assignment)
- ✓ POST `/db/tasks/<task_id>/complete` - Complete task and assignment (when last task)
- ✓ POST `/db/tasks/<task_id>/complete` - Non-existent task (404)
- ✓ PUT `/db/assignments/<assignment_id>` - Update assignment

### Blind Box API Tests (`test_blindbox_api.py`)
Tests for `/db/blind-boxes` and `/db/users/<user_id>/figures` endpoints:
- ✓ GET `/db/users/<user_id>/figures` - Fetch user's figures (empty collection)
- ✓ GET `/db/users/<user_id>/figures` - Fetch user's figures (with purchases)
- ✓ POST `/db/blind-boxes/purchase` - Validation (missing user_id)
- ✓ POST `/db/blind-boxes/purchase` - Non-existent user (404)
- ✓ POST `/db/blind-boxes/purchase` - Insufficient points (400)
- ✓ POST `/db/blind-boxes/purchase` - Series with no figures (404)
- ✓ POST `/db/blind-boxes/purchase` - Successful purchase with point deduction
- ✓ POST `/db/blind-boxes/purchase` - Auto-select affordable series

## Test Output

Each test suite provides:
- ✅ Colored output (green for pass, red for fail)
- 📊 Detailed test results with status codes and response data
- 📝 Summary with pass/fail counts
- 🔍 Error messages for debugging

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Import utilities from `utils.py`:
   ```python
   from utils import APIClient, print_test_result, print_section
   ```
3. Follow the existing test patterns for consistency
4. Update this README with the new test suite information
5. Add the test suite to `run_tests.sh` if needed

