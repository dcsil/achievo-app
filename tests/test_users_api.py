"""
Test suite for /db/users API endpoints

Run this test while the backend server is running on localhost:5000
"""
import sys
import uuid
from utils import APIClient, print_test_result, print_section

client = APIClient()

created_users = []


def test_get_all_users():
    """Test GET /db/users - fetch all users"""
    print_section("Testing GET /db/users - Fetch All Users")
    
    response = client.get("/db/users")
    
    passed = response.status_code == 200
    print_test_result(
        "GET /db/users returns 200",
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
            
            if is_list and len(data) > 0:
                print(f"  Found {len(data)} users in database")
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_create_user():
    """Test POST /db/users - create a new user"""
    print_section("Testing POST /db/users - Create User")
    
    test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    test_data = {
        "user_id": test_user_id,
        "canvas_username": "test_canvas_user",
        "total_points": 100,
        "current_level": 1
    }
    
    response = client.post("/db/users", data=test_data)
    
    passed = response.status_code == 201
    print_test_result(
        "POST /db/users returns 201",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            has_status = data.get("status") == "created"
            has_user_id = data.get("user_id") == test_user_id
            
            print_test_result(
                "Response contains 'created' status",
                has_status,
                f"Status: {data.get('status')}"
            )
            print_test_result(
                "Response contains correct user_id",
                has_user_id,
                f"User ID: {data.get('user_id')}"
            )
            
            if has_status and has_user_id:
                created_users.append(test_user_id)
                print(f"  Created test user: {test_user_id}")
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_create_user_missing_required_field():
    """Test POST /db/users - validation for missing required field"""
    print_section("Testing POST /db/users - Missing Required Field")
    
    test_data = {
        "canvas_username": "test_user_no_id",
        "total_points": 50
    }
    
    response = client.post("/db/users", data=test_data)
    
    passed = response.status_code == 400
    print_test_result(
        "POST /db/users returns 400 for missing user_id",
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


def test_get_user_by_id():
    """Test GET /db/users?user_id=X - fetch specific user"""
    print_section("Testing GET /db/users?user_id=X - Fetch Specific User")
    
    test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    test_data = {
        "user_id": test_user_id,
        "canvas_username": "test_fetch_user",
        "total_points": 200,
        "current_level": 2
    }
    
    create_response = client.post("/db/users", data=test_data)
    if create_response.status_code == 201:
        created_users.append(test_user_id)
        print(f"  Setup: Created user {test_user_id}")
    
    response = client.get("/db/users", params={"user_id": test_user_id})
    
    passed = response.status_code == 200
    print_test_result(
        "GET /db/users?user_id returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    if passed:
        try:
            data = response.json()
            correct_id = data.get("user_id") == test_user_id
            has_username = data.get("canvas_username") == "test_fetch_user"
            has_points = data.get("total_points") == 200
            has_level = data.get("current_level") == 2
            
            print_test_result(
                "Response contains correct user_id",
                correct_id,
                f"User ID: {data.get('user_id')}"
            )
            print_test_result(
                "Response contains correct canvas_username",
                has_username,
                f"Username: {data.get('canvas_username')}"
            )
            print_test_result(
                "Response contains correct total_points",
                has_points,
                f"Points: {data.get('total_points')}"
            )
            print_test_result(
                "Response contains correct current_level",
                has_level,
                f"Level: {data.get('current_level')}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_get_nonexistent_user():
    """Test GET /db/users?user_id=X - fetch non-existent user"""
    print_section("Testing GET /db/users?user_id=X - Non-existent User")
    
    fake_user_id = "nonexistent_user_12345"
    response = client.get("/db/users", params={"user_id": fake_user_id})
    
    passed = response.status_code == 404
    print_test_result(
        "GET /db/users returns 404 for non-existent user",
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


def run_all_tests():
    """Run all user API tests"""
    print("\n" + "=" * 60)
    print("  ACHIEVO APP - USER API TEST SUITE")
    print("=" * 60)
    print("  Make sure the backend server is running on http://127.0.0.1:5000")
    print("=" * 60)
    
    tests = [
        test_get_all_users,
        test_create_user,
        test_create_user_missing_required_field,
        test_get_user_by_id,
        test_get_nonexistent_user,
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
    
    print_section("TEST SUMMARY")
    total = passed_count + failed_count
    print(f"  Total Tests: {total}")
    print(f"  \033[92mPassed: {passed_count}\033[0m")
    if failed_count > 0:
        print(f"  \033[91mFailed: {failed_count}\033[0m")
    else:
        print(f"  Failed: {failed_count}")
    
    if created_users:
        print(f"\n  Note: {len(created_users)} test user(s) created during testing")
        print("  Test user IDs:", ", ".join(created_users))
    
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
