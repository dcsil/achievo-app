"""
Utility functions for API testing
"""
import requests
from typing import Dict, Any, Optional
from config import BASE_URL


class APIClient:
    """Helper class for making API requests"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
    
    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> requests.Response:
        """Make a GET request"""
        url = f"{self.base_url}{endpoint}"
        return requests.get(url, params=params)
    
    def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> requests.Response:
        """Make a POST request"""
        url = f"{self.base_url}{endpoint}"
        return requests.post(url, json=data)
    
    def put(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> requests.Response:
        """Make a PUT request"""
        url = f"{self.base_url}{endpoint}"
        return requests.put(url, json=data)
    
    def delete(self, endpoint: str) -> requests.Response:
        """Make a DELETE request"""
        url = f"{self.base_url}{endpoint}"
        return requests.delete(url)


def print_test_result(test_name: str, passed: bool, message: str = ""):
    """Print formatted test result"""
    status = "✓ PASS" if passed else "✗ FAIL"
    color = "\033[92m" if passed else "\033[91m"
    reset = "\033[0m"
    print(f"{color}{status}{reset} - {test_name}")
    if message:
        print(f"  {message}")


def print_section(title: str):
    """Print a section header"""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def cleanup_test_data(client: APIClient, users=None, tasks=None, assignments=None, 
                     series=None, figures=None, purchases=None):
    """
    Clean up test data created during testing
    
    Args:
        client: APIClient instance
        users: List of user_ids to delete
        tasks: List of task_ids to delete
        assignments: List of assignment_ids to delete
        series: List of series_ids to delete
        figures: List of figure_ids to delete
        purchases: List of purchase_ids to delete
    """
    cleanup_count = 0
    
    # Clean up purchases first (has foreign key dependencies)
    if purchases:
        for purchase_id in purchases:
            try:
                response = client.delete(f"/db/user-blind-boxes/{purchase_id}")
                if response.status_code in [200, 204]:
                    cleanup_count += 1
            except Exception as e:
                print(f"  Warning: Failed to delete purchase {purchase_id}: {str(e)}")
    
    # Clean up tasks (depends on users and assignments)
    if tasks:
        for task_id in tasks:
            try:
                response = client.delete(f"/db/tasks/{task_id}")
                if response.status_code in [200, 204]:
                    cleanup_count += 1
            except Exception as e:
                print(f"  Warning: Failed to delete task {task_id}: {str(e)}")
    
    # Clean up assignments
    if assignments:
        for assignment_id in assignments:
            try:
                response = client.delete(f"/db/assignments/{assignment_id}")
                if response.status_code in [200, 204]:
                    cleanup_count += 1
            except Exception as e:
                print(f"  Warning: Failed to delete assignment {assignment_id}: {str(e)}")
    
    # Clean up figures
    if figures:
        for figure_id in figures:
            try:
                response = client.delete(f"/db/blind-box-figures/{figure_id}")
                if response.status_code in [200, 204]:
                    cleanup_count += 1
            except Exception as e:
                print(f"  Warning: Failed to delete figure {figure_id}: {str(e)}")
    
    # Clean up series
    if series:
        for series_id in series:
            try:
                response = client.delete(f"/db/blind-box-series/{series_id}")
                if response.status_code in [200, 204]:
                    cleanup_count += 1
            except Exception as e:
                print(f"  Warning: Failed to delete series {series_id}: {str(e)}")
    
    # Clean up users last
    if users:
        for user_id in users:
            try:
                response = client.delete(f"/db/users/{user_id}")
                if response.status_code in [200, 204]:
                    cleanup_count += 1
            except Exception as e:
                print(f"  Warning: Failed to delete user {user_id}: {str(e)}")
    
    if cleanup_count > 0:
        print(f"\n  ✓ Cleaned up {cleanup_count} test record(s)")
