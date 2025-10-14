"""
Test suite for /db/blind-boxes and /db/users/<user_id>/figures API endpoints

Run this test while the backend server is running on http://127.0.0.1:5000
"""
import sys
import uuid
from datetime import datetime
from utils import APIClient, print_test_result, print_section

# Initialize API client
client = APIClient()

# Track created test data for reference
created_users = []
created_series = []
created_figures = []
created_purchases = []


def setup_test_user(points=1000):
    """Helper function to create a test user with points"""
    user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    test_data = {
        "user_id": user_id,
        "canvas_username": "test_blindbox_user",
        "total_points": points,
        "current_level": 1
    }
    
    response = client.post("/db/users", data=test_data)
    if response.status_code == 201:
        created_users.append(user_id)
        return user_id
    return None


def setup_test_series(cost_points=100):
    """Helper function to create a test blind box series"""
    series_id = f"test_series_{uuid.uuid4().hex[:8]}"
    test_data = {
        "series_id": series_id,
        "name": "Test Blind Box Series",
        "description": "A test series for unit tests",
        "cost_points": cost_points,
        "release_date": datetime.now().isoformat()
    }
    
    response = client.post("/db/blind-box-series", data=test_data)
    if response.status_code == 201:
        created_series.append(series_id)
        return series_id
    return None


def setup_test_figure(series_id, rarity="common", weight=1.0):
    """Helper function to create a test figure"""
    figure_id = f"test_figure_{uuid.uuid4().hex[:8]}"
    test_data = {
        "figure_id": figure_id,
        "series_id": series_id,
        "name": f"Test Figure {rarity}",
        "rarity": rarity,
        "weight": weight
    }
    
    response = client.post("/db/blind-box-figures", data=test_data)
    if response.status_code == 201:
        created_figures.append(figure_id)
        return figure_id
    return None


def test_get_user_figures_empty():
    """Test GET /db/users/<user_id>/figures - user with no figures"""
    print_section("Testing GET /db/users/<user_id>/figures - Empty Collection")
    
    # Create a new user
    user_id = setup_test_user()
    if not user_id:
        print_test_result("Setup: Create test user", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id}")
    
    # Get figures for user (should be empty)
    response = client.get(f"/db/users/{user_id}/figures")
    
    # Check status code
    passed = response.status_code == 200
    print_test_result(
        "GET /db/users/<user_id>/figures returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    # Check response is empty list
    if passed:
        try:
            data = response.json()
            is_list = isinstance(data, list)
            is_empty = len(data) == 0
            
            print_test_result(
                "Response is a list",
                is_list,
                f"Type: {type(data).__name__}"
            )
            print_test_result(
                "List is empty (user has no figures)",
                is_empty,
                f"Count: {len(data)}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_purchase_blind_box_missing_user_id():
    """Test POST /db/blind-boxes/purchase - missing user_id validation"""
    print_section("Testing POST /db/blind-boxes/purchase - Missing user_id")
    
    response = client.post("/db/blind-boxes/purchase", data={})
    
    # Should return 400 Bad Request
    passed = response.status_code == 400
    print_test_result(
        "POST /db/blind-boxes/purchase returns 400 for missing user_id",
        passed,
        f"Status: {response.status_code}"
    )
    
    # Check error message
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


def test_purchase_blind_box_user_not_found():
    """Test POST /db/blind-boxes/purchase - non-existent user"""
    print_section("Testing POST /db/blind-boxes/purchase - User Not Found")
    
    fake_user_id = "nonexistent_user_12345"
    response = client.post("/db/blind-boxes/purchase", data={"user_id": fake_user_id})
    
    # Should return 404 Not Found
    passed = response.status_code == 404
    print_test_result(
        "POST /db/blind-boxes/purchase returns 404 for non-existent user",
        passed,
        f"Status: {response.status_code}"
    )
    
    return passed


def test_purchase_blind_box_insufficient_points():
    """Test POST /db/blind-boxes/purchase - insufficient points"""
    print_section("Testing POST /db/blind-boxes/purchase - Insufficient Points")
    
    # Create user with few points
    user_id = setup_test_user(points=10)
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id} with 10 points")
    
    # Create expensive series
    series_id = setup_test_series(cost_points=1000)
    if not series_id:
        print_test_result("Setup", False, "Failed to create test series")
        return False
    print(f"  Setup: Created series {series_id} costing 1000 points")
    
    # Try to purchase (should fail)
    response = client.post("/db/blind-boxes/purchase", data={
        "user_id": user_id,
        "series_id": series_id
    })
    
    # Should return 400 Bad Request
    passed = response.status_code == 400
    print_test_result(
        "POST /db/blind-boxes/purchase returns 400 for insufficient points",
        passed,
        f"Status: {response.status_code}"
    )
    
    # Check error message
    if passed:
        try:
            data = response.json()
            has_error = "error" in data and "insufficient" in data.get("error", "").lower()
            print_test_result(
                "Response contains 'insufficient points' error",
                has_error,
                f"Error: {data.get('error')}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_purchase_blind_box_no_figures():
    """Test POST /db/blind-boxes/purchase - series with no figures"""
    print_section("Testing POST /db/blind-boxes/purchase - No Figures Available")
    
    # Create user with points
    user_id = setup_test_user(points=500)
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id}")
    
    # Create series but NO figures
    series_id = setup_test_series(cost_points=100)
    if not series_id:
        print_test_result("Setup", False, "Failed to create test series")
        return False
    print(f"  Setup: Created series {series_id} with no figures")
    
    # Try to purchase (should fail)
    response = client.post("/db/blind-boxes/purchase", data={
        "user_id": user_id,
        "series_id": series_id
    })
    
    # Should return 404 Not Found
    passed = response.status_code == 404
    print_test_result(
        "POST /db/blind-boxes/purchase returns 404 for series with no figures",
        passed,
        f"Status: {response.status_code}"
    )
    
    return passed


def test_purchase_blind_box_success():
    """Test POST /db/blind-boxes/purchase - successful purchase"""
    print_section("Testing POST /db/blind-boxes/purchase - Successful Purchase")
    
    # Create user with points
    user_id = setup_test_user(points=500)
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id} with 500 points")
    
    # Create series
    series_id = setup_test_series(cost_points=100)
    if not series_id:
        print_test_result("Setup", False, "Failed to create test series")
        return False
    print(f"  Setup: Created series {series_id}")
    
    # Create figures in the series
    figure_ids = []
    for rarity, weight in [("common", 0.5), ("rare", 0.3), ("legendary", 0.2)]:
        figure_id = setup_test_figure(series_id, rarity, weight)
        if figure_id:
            figure_ids.append(figure_id)
    print(f"  Setup: Created {len(figure_ids)} figures")
    
    # Purchase blind box
    response = client.post("/db/blind-boxes/purchase", data={
        "user_id": user_id,
        "series_id": series_id
    })
    
    # Check status code
    passed = response.status_code == 201
    print_test_result(
        "POST /db/blind-boxes/purchase returns 201",
        passed,
        f"Status: {response.status_code}"
    )
    
    # Check response data
    if passed:
        try:
            data = response.json()
            has_status = data.get("status") == "purchased"
            has_purchase_id = "purchase_id" in data
            has_series_info = data.get("series_id") == series_id
            has_figure = "awarded_figure" in data
            has_remaining_points = data.get("remaining_points") == 400  # 500 - 100
            
            print_test_result(
                "Response contains 'purchased' status",
                has_status,
                f"Status: {data.get('status')}"
            )
            print_test_result(
                "Response contains purchase_id",
                has_purchase_id,
                f"Purchase ID: {data.get('purchase_id', 'N/A')[:20]}..."
            )
            print_test_result(
                "Response contains correct series_id",
                has_series_info,
                f"Series ID: {data.get('series_id')}"
            )
            print_test_result(
                "Response contains awarded_figure",
                has_figure,
                f"Figure: {data.get('awarded_figure', {}).get('name', 'N/A')}"
            )
            print_test_result(
                "Points correctly deducted (500 - 100 = 400)",
                has_remaining_points,
                f"Remaining: {data.get('remaining_points')}"
            )
            
            if has_purchase_id:
                created_purchases.append(data.get("purchase_id"))
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_purchase_blind_box_auto_select_series():
    """Test POST /db/blind-boxes/purchase - auto-select affordable series"""
    print_section("Testing POST /db/blind-boxes/purchase - Auto-Select Series")
    
    # Create user with limited points
    user_id = setup_test_user(points=150)
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    print(f"  Setup: Created user {user_id} with 150 points")
    
    # Create affordable series
    series_id = setup_test_series(cost_points=100)
    if not series_id:
        print_test_result("Setup", False, "Failed to create test series")
        return False
    
    # Add figure to series
    figure_id = setup_test_figure(series_id, "common", 1.0)
    print(f"  Setup: Created series {series_id} with figure")
    
    # Purchase without specifying series_id (should auto-select)
    response = client.post("/db/blind-boxes/purchase", data={
        "user_id": user_id
    })
    
    # Check status code
    passed = response.status_code == 201
    print_test_result(
        "POST /db/blind-boxes/purchase returns 201 (auto-selected series)",
        passed,
        f"Status: {response.status_code}"
    )
    
    # Check that a series was selected
    if passed:
        try:
            data = response.json()
            has_series = "series_id" in data
            print_test_result(
                "Response contains auto-selected series_id",
                has_series,
                f"Series ID: {data.get('series_id', 'N/A')}"
            )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def test_get_user_figures_with_purchases():
    """Test GET /db/users/<user_id>/figures - user with purchased figures"""
    print_section("Testing GET /db/users/<user_id>/figures - With Purchases")
    
    # Create user
    user_id = setup_test_user(points=1000)
    if not user_id:
        print_test_result("Setup", False, "Failed to create test user")
        return False
    
    # Create series and figures
    series_id = setup_test_series(cost_points=50)
    figure_id = setup_test_figure(series_id, "rare", 1.0)
    print(f"  Setup: Created user {user_id}, series, and figure")
    
    # Purchase a blind box
    purchase_response = client.post("/db/blind-boxes/purchase", data={
        "user_id": user_id,
        "series_id": series_id
    })
    
    if purchase_response.status_code != 201:
        print_test_result("Setup: Purchase blind box", False, "Failed to purchase")
        return False
    
    print(f"  Setup: Purchased blind box")
    
    # Now get user's figures
    response = client.get(f"/db/users/{user_id}/figures")
    
    # Check status code
    passed = response.status_code == 200
    print_test_result(
        "GET /db/users/<user_id>/figures returns 200",
        passed,
        f"Status: {response.status_code}"
    )
    
    # Check response contains figures
    if passed:
        try:
            data = response.json()
            is_list = isinstance(data, list)
            has_figures = len(data) > 0
            
            print_test_result(
                "Response is a list",
                is_list,
                f"Type: {type(data).__name__}"
            )
            print_test_result(
                "User has at least one figure",
                has_figures,
                f"Count: {len(data)}"
            )
            
            if has_figures:
                figure = data[0]
                has_figure_info = "figure_name" in figure and "figure_rarity" in figure
                has_series_info = "series_name" in figure
                
                print_test_result(
                    "Figure contains name and rarity",
                    has_figure_info,
                    f"Name: {figure.get('figure_name', 'N/A')}, Rarity: {figure.get('figure_rarity', 'N/A')}"
                )
                print_test_result(
                    "Figure contains series information",
                    has_series_info,
                    f"Series: {figure.get('series_name', 'N/A')}"
                )
        except Exception as e:
            print_test_result("Response is valid JSON", False, str(e))
    
    return passed


def run_all_tests():
    """Run all blind box API tests"""
    print("\n" + "=" * 60)
    print("  ACHIEVO APP - BLIND BOX API TEST SUITE")
    print("=" * 60)
    print("  Make sure the backend server is running on http://127.0.0.1:5000")
    print("=" * 60)
    
    tests = [
        test_get_user_figures_empty,
        test_purchase_blind_box_missing_user_id,
        test_purchase_blind_box_user_not_found,
        test_purchase_blind_box_insufficient_points,
        test_purchase_blind_box_no_figures,
        test_purchase_blind_box_success,
        test_purchase_blind_box_auto_select_series,
        test_get_user_figures_with_purchases,
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
    
    if created_users:
        print(f"\n  Note: {len(created_users)} test user(s) created during testing")
    if created_series:
        print(f"  Note: {len(created_series)} test series created during testing")
    if created_figures:
        print(f"  Note: {len(created_figures)} test figure(s) created during testing")
    if created_purchases:
        print(f"  Note: {len(created_purchases)} test purchase(s) created during testing")
    
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
