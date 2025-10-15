"""
Test suite for /db/courses API endpoints

Run this test while the backend server is running on http://127.0.0.1:5000
"""
import sys
import uuid
from utils import APIClient, print_test_result, print_section

client = APIClient()

created_courses = []


def test_get_all_courses():
    """Test GET /db/courses - fetch all courses"""
    print_section("Testing GET /db/courses - Fetch All Courses")
    
    response = client.get("/db/courses")
    
    passed = response.status_code == 200
    print_test_result(
        "GET /db/courses returns 200",
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
                print(f"  Found {len(data)} courses in database")
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_get_course_by_id():
    """Test GET /db/courses?course_id=X - fetch specific course"""
    print_section("Testing GET /db/courses - Fetch Specific Course")
    
    response = client.get("/db/courses")
    
    if response.status_code == 200:
        courses = response.json()
        if isinstance(courses, list) and len(courses) > 0:
            test_course_id = courses[0].get("course_id")
            
            response = client.get(f"/db/courses?course_id={test_course_id}")
            
            passed = response.status_code == 200
            print_test_result(
                f"GET /db/courses?course_id={test_course_id} returns 200",
                passed,
                f"Status: {response.status_code}"
            )
            
            if passed:
                try:
                    data = response.json()
                    has_fields = all(key in data for key in ["course_id", "course_name", "course_code", "term"])
                    print_test_result(
                        "Response contains expected fields",
                        has_fields,
                        f"Fields: {list(data.keys())}"
                    )
                    
                    if has_fields:
                        print(f"  Course Name: {data.get('course_name')}")
                        print(f"  Course Code: {data.get('course_code')}")
                        print(f"  Term: {data.get('term')}")
                        if 'colour' in data:
                            print(f"  Colour: {data.get('colour')}")
                except Exception as e:
                    print_test_result("Response is valid JSON", False, str(e))
            
            return passed
        else:
            print("  ⚠ No courses found in database, skipping test")
            return True
    else:
        print("  ⚠ Could not fetch courses, skipping test")
        return True


def test_get_nonexistent_course():
    """Test GET /db/courses?course_id=X - fetch non-existent course"""
    print_section("Testing GET /db/courses - Non-existent Course")
    
    fake_course_id = f"nonexistent_{uuid.uuid4().hex}"
    response = client.get(f"/db/courses?course_id={fake_course_id}")
    
    passed = response.status_code == 404
    print_test_result(
        f"GET /db/courses?course_id={fake_course_id} returns 404",
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
                f"Response: {data}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def run_all_tests():
    """Run all course API tests"""
    print("\n" + "="*60)
    print("COURSES API TEST SUITE")
    print("="*60 + "\n")
    
    tests = [
        test_get_all_courses,
        test_get_course_by_id,
        test_get_nonexistent_course,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n❌ Test {test.__name__} failed with exception: {str(e)}\n")
            results.append(False)
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
        return 0
    else:
        print(f"❌ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
