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
