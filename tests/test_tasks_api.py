"""
Test suite for /db/tasks API endpoints

Run this test while the backend server is running on localhost:5000
"""
import sys
import uuid
from datetime import datetime, timedelta
from utils import APIClient, print_test_result, print_section

client = APIClient()

created_tasks = []
created_users = []
created_assignments = []


def setup_test_user():
    """Helper function to create a test user"""
    user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    test_data = {
        "user_id": user_id,
        "canvas_username": "test_tasks_user",
        "total_points": 100,
        "current_level": 1
    }
    
    response = client.post("/db/users", data=test_data)
    if response.status_code == 201:
        created_users.append(user_id)
        return user_id
    return None


def setup_test_assignment(course_id="CS101"):
    """Helper function to create a test assignment"""
    assignment_id = f"test_assignment_{uuid.uuid4().hex[:8]}"
    test_data = {
        "assignment_id": assignment_id,
        "course_id": course_id,
        "title": "Test Assignment",
        "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
        "completion_points": 50,
        "is_complete": False
    }
    
    response = client.post("/db/assignments", data=test_data)
    if response.status_code == 201:
        created_assignments.append(assignment_id)
        return assignment_id
    return None


def test_create_task():
    """Test POST /db/tasks - create a new task"""
    print_section("Testing POST /db/tasks - Create Task")
    
    user_id = setup_test_user()
    if not user_id:
        print_test_result("Setup: Create test user", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id}")
    
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    test_data = {
        "task_id": task_id,
        "user_id": user_id,
        "description": "Complete coding assignment",
        "type": "assignment",
        "scheduled_start_at": datetime.now().isoformat(),
        "scheduled_end_at": (datetime.now() + timedelta(days=3)).isoformat(),
        "is_completed": False,
        "reward_points": 10
    }
    
    response = client.post("/db/tasks", data=test_data)
    
    passed = response.status_code == 201
    print_test_result(
        "POST /db/tasks returns 201",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            has_status = data.get("status") == "created"
            has_task_id = data.get("task_id") == task_id
            
            print_test_result(
                "Response contains 'created' status",
                has_status,
                f"Status: {data.get('status')}"
            )
            print_test_result(
                "Response contains correct task_id",
                has_task_id,
                f"Task ID: {data.get('task_id')}"
            )
            
            if has_status and has_task_id:
                created_tasks.append(task_id)
                print(f"  Created test task: {task_id}")
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_create_task_missing_required_fields():
    """Test POST /db/tasks - validation for missing required fields"""
    print_section("Testing POST /db/tasks - Missing Required Fields")
    
    test_cases = [
        ({"user_id": "user1", "description": "test", "type": "task"}, "task_id"),
        ({"task_id": "task1", "description": "test", "type": "task"}, "user_id"),
        ({"task_id": "task1", "user_id": "user1", "type": "task"}, "description"),
        ({"task_id": "task1", "user_id": "user1", "description": "test"}, "type"),
    ]
    
    all_passed = True
    for test_data, missing_field in test_cases:
        response = client.post("/db/tasks", data=test_data)
        passed = response.status_code == 400
        print_test_result(
            f"POST /db/tasks returns 400 for missing {missing_field}",
            passed,
            f"Status: {response.status_code}"
        )
        all_passed = all_passed and passed
    
    return all_passed


def test_get_tasks_by_user():
    """Test GET /db/tasks?user_id=X - fetch tasks for a user"""
    print_section("Testing GET /db/tasks?user_id=X - Fetch User Tasks")
    
    user_id = setup_test_user()
    if not user_id:
        print_test_result("Setup: Create test user", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id}")
    
    task_ids = []
    for i in range(3):
        task_id = f"test_task_{uuid.uuid4().hex[:8]}"
        test_data = {
            "task_id": task_id,
            "user_id": user_id,
            "description": f"Test task {i+1}",
            "type": "general",
            "reward_points": 5
        }
        response = client.post("/db/tasks", data=test_data)
        if response.status_code == 201:
            task_ids.append(task_id)
            created_tasks.append(task_id)
    
    print(f"  Setup: Created {len(task_ids)} tasks")
    
    response = client.get("/db/tasks", params={"user_id": user_id})
    
    passed = response.status_code == 200
    print_test_result(
        "GET /db/tasks?user_id returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            is_list = isinstance(data, list)
            print_test_result(
                "Response is a list",
                is_list,
                f"Type: {type(data).__name__}"
            )
            
            if is_list:
                correct_count = len(data) >= len(task_ids)
                print_test_result(
                    f"Response contains at least {len(task_ids)} tasks",
                    correct_count,
                    f"Found {len(data)} tasks"
                )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_get_tasks_missing_user_id():
    """Test GET /db/tasks - validation for missing user_id"""
    print_section("Testing GET /db/tasks - Missing user_id")
    
    response = client.get("/db/tasks")
    
    passed = response.status_code == 400
    print_test_result(
        "GET /db/tasks returns 400 for missing user_id",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            has_error = "error" in data
            print_test_result(
                "Response contains error message",
                has_error,
                f"Error: {data.get('error')}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_get_tasks_with_filters():
    """Test GET /db/tasks with optional filters"""
    print_section("Testing GET /db/tasks - With Filters")
    
    user_id = setup_test_user()
    assignment_id = setup_test_assignment()
    
    if not user_id or not assignment_id:
        print_test_result("Setup", False, "Failed to create test data")
        return False
    
    print(f"  Setup: Created user {user_id} and assignment {assignment_id}")
    
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    start_time = datetime.now()
    end_time = start_time + timedelta(days=2)
    
    test_data = {
        "task_id": task_id,
        "user_id": user_id,
        "assignment_id": assignment_id,
        "description": "Assignment task",
        "type": "assignment",
        "scheduled_start_at": start_time.isoformat(),
        "scheduled_end_at": end_time.isoformat(),
        "reward_points": 15
    }
    
    response = client.post("/db/tasks", data=test_data)
    if response.status_code == 201:
        created_tasks.append(task_id)
        print(f"  Setup: Created task {task_id}")
    
    response = client.get("/db/tasks", params={
        "user_id": user_id,
        "assignment_id": assignment_id
    })
    
    passed = response.status_code == 200
    print_test_result(
        "GET /db/tasks with assignment_id filter returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                has_correct_assignment = any(t.get("assignment_id") == assignment_id for t in data)
                print_test_result(
                    "Filtered tasks have correct assignment_id",
                    has_correct_assignment,
                    f"Found {len(data)} task(s) with assignment_id"
                )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_update_task():
    """Test PUT /db/tasks/<task_id> - update a task"""
    print_section("Testing PUT /db/tasks/<task_id> - Update Task")
    
    user_id = setup_test_user()
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    test_data = {
        "task_id": task_id,
        "user_id": user_id,
        "description": "Original description",
        "type": "general",
        "scheduled_start_at": datetime.now().isoformat(),
        "reward_points": 10
    }
    
    create_response = client.post("/db/tasks", data=test_data)
    if create_response.status_code == 201:
        created_tasks.append(task_id)
        print(f"  Setup: Created task {task_id}")
    
    update_data = {
        "description": "Updated description",
        "scheduled_end_at": (datetime.now() + timedelta(days=5)).isoformat()
    }
    
    response = client.put(f"/db/tasks/{task_id}", data=update_data)
    
    passed = response.status_code == 200
    print_test_result(
        "PUT /db/tasks/<task_id> returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            has_status = data.get("status") == "updated"
            has_task_id = data.get("task_id") == task_id
            
            print_test_result(
                "Response contains 'updated' status",
                has_status,
                f"Status: {data.get('status')}"
            )
            print_test_result(
                "Response contains correct task_id",
                has_task_id,
                f"Task ID: {data.get('task_id')}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_update_task_missing_fields():
    """Test PUT /db/tasks/<task_id> - validation for missing all fields"""
    print_section("Testing PUT /db/tasks/<task_id> - No Fields to Update")
    
    task_id = "some_task_id"
    update_data = {}
    
    response = client.put(f"/db/tasks/{task_id}", data=update_data)
    
    passed = response.status_code == 400
    print_test_result(
        "PUT /db/tasks/<task_id> returns 400 for missing fields",
        passed,
        f"Status: {response.status_code}"
    )
    
    return passed


def test_complete_task():
    """Test POST /db/tasks/<task_id>/complete - complete a task"""
    print_section("Testing POST /db/tasks/<task_id>/complete - Complete Task")
    
    user_id = setup_test_user()
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    test_data = {
        "task_id": task_id,
        "user_id": user_id,
        "description": "Task to complete",
        "type": "general",
        "reward_points": 20
    }
    
    create_response = client.post("/db/tasks", data=test_data)
    if create_response.status_code == 201:
        created_tasks.append(task_id)
        print(f"  Setup: Created task {task_id}")
    
    response = client.post(f"/db/tasks/{task_id}/complete")
    
    passed = response.status_code == 200
    print_test_result(
        "POST /db/tasks/<task_id>/complete returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            has_status = data.get("status") == "completed"
            has_task_id = data.get("task_id") == task_id
            has_points = "points_earned" in data
            assignment_completed = data.get("assignment_completed", False)
            
            print_test_result(
                "Response contains 'completed' status",
                has_status,
                f"Status: {data.get('status')}"
            )
            print_test_result(
                "Response contains correct task_id",
                has_task_id,
                f"Task ID: {data.get('task_id')}"
            )
            print_test_result(
                "Response contains points_earned",
                has_points,
                f"Points: {data.get('points_earned')}"
            )
            print_test_result(
                "assignment_completed is False (no assignment)",
                not assignment_completed,
                f"Assignment completed: {assignment_completed}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_complete_task_with_assignment_completion():
    """Test POST /db/tasks/<task_id>/complete - complete last task to complete assignment"""
    print_section("Testing POST /db/tasks/<task_id>/complete - Assignment Completion")
    
    user_id = setup_test_user()
    assignment_id = setup_test_assignment()
    
    if not user_id or not assignment_id:
        print_test_result("Setup", False, "Failed to create test data")
        return False
    
    print(f"  Setup: Created user {user_id} and assignment {assignment_id}")
    
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    test_data = {
        "task_id": task_id,
        "user_id": user_id,
        "assignment_id": assignment_id,
        "course_id": "CS101",
        "description": "Only task for assignment",
        "type": "assignment",
        "reward_points": 10
    }
    
    create_response = client.post("/db/tasks", data=test_data)
    if create_response.status_code == 201:
        created_tasks.append(task_id)
        print(f"  Setup: Created task {task_id} for assignment")
    
    response = client.post(f"/db/tasks/{task_id}/complete")
    
    passed = response.status_code == 200
    print_test_result(
        "POST /db/tasks/<task_id>/complete returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            assignment_completed = data.get("assignment_completed", False)
            has_assignment_id = data.get("assignment_id") == assignment_id
            has_completion_points = data.get("points_earned") == 50  # From assignment completion_points
            
            print_test_result(
                "assignment_completed is True",
                assignment_completed,
                f"Assignment completed: {assignment_completed}"
            )
            print_test_result(
                "Response contains assignment_id",
                has_assignment_id,
                f"Assignment ID: {data.get('assignment_id')}"
            )
            print_test_result(
                "Points earned are from assignment completion",
                has_completion_points,
                f"Points: {data.get('points_earned')} (expected 50)"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_update_assignment():
    """Test PUT /db/assignments/<assignment_id> - update an assignment"""
    print_section("Testing PUT /db/assignments/<assignment_id> - Update Assignment")
    
    assignment_id = setup_test_assignment()
    if not assignment_id:
        print_test_result("Setup", False, "Failed to create test assignment")
        return False
    print(f"  Setup: Created assignment {assignment_id}")
    
    new_title = "Updated Test Assignment"
    new_due_date = (datetime.now() + timedelta(days=14)).isoformat()
    update_data = {
        "title": new_title,
        "due_date": new_due_date
    }
    
    response = client.put(f"/db/assignments/{assignment_id}", data=update_data)
    
    passed = response.status_code == 200
    print_test_result(
        "PUT /db/assignments/<assignment_id> returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            has_status = data.get("status") == "updated"
            has_assignment_id = data.get("assignment_id") == assignment_id
            
            print_test_result(
                "Response contains 'updated' status",
                has_status,
                f"Status: {data.get('status')}"
            )
            print_test_result(
                "Response contains correct assignment_id",
                has_assignment_id,
                f"Assignment ID: {data.get('assignment_id')}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_complete_nonexistent_task():
    """Test POST /db/tasks/<task_id>/complete - complete non-existent task"""
    print_section("Testing POST /db/tasks/<task_id>/complete - Non-existent Task")
    
    fake_task_id = "nonexistent_task_12345"
    response = client.post(f"/db/tasks/{fake_task_id}/complete")
    
    passed = response.status_code == 404
    print_test_result(
        "POST /db/tasks/<task_id>/complete returns 404 for non-existent task",
        passed,
        f"Status: {response.status_code}"
    )
    
    return passed


def run_all_tests():
    """Run all task API tests"""
    print("\n" + "=" * 60)
    print("  ACHIEVO APP - TASK API TEST SUITE")
    print("=" * 60)
    print("  Make sure the backend server is running on http://127.0.0.1:5000")
    print("=" * 60)
    
    tests = [
        test_create_task,
        test_create_task_missing_required_fields,
        test_get_tasks_by_user,
        test_get_tasks_missing_user_id,
        test_get_tasks_with_filters,
        test_update_task,
        test_update_task_missing_fields,
        test_complete_task,
        test_complete_task_with_assignment_completion,
        test_update_assignment,
        test_complete_nonexistent_task,
    ]
    
    passed_count = 0
    failed_count = 0
    
    for test in tests:
        try:
            result = test()
            if result:
                passed_count += 1
            else:
                failed_count += 1
        except Exception as e:
            print_test_result(test.__name__, False, f"Exception: {str(e)}")
            failed_count += 1
    
    # Print summary
    print_section("TEST SUMMARY")
    total = passed_count + failed_count
    print(f"  Total Tests: {total}")
    print(f"  \033[92mPassed: {passed_count}\033[0m")
    if failed_count > 0:
        print(f"  \033[91mFailed: {failed_count}\033[0m")
    else:
        print(f"  Failed: {failed_count}")
    
    if created_tasks:
        print(f"\n  Note: {len(created_tasks)} test task(s) created during testing")
    if created_users:
        print(f"  Note: {len(created_users)} test user(s) created during testing")
    if created_assignments:
        print(f"  Note: {len(created_assignments)} test assignment(s) created during testing")
    
    print("=" * 60 + "\n")
    
    return failed_count == 0


if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
        sys.exit(1)
