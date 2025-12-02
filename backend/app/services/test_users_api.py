"""Pytest tests for /db/users API endpoints."""
import pytest
import uuid
from datetime import datetime


@pytest.fixture
def test_user_id():
    """Generate unique user ID for testing."""
    return f"test_user_{uuid.uuid4().hex[:8]}"


def test_create_and_get_user(client, test_user_id):
    """Test POST /db/users - create a new user, then GET to verify."""
    payload = {
        "user_id": test_user_id,
        "email": f"{test_user_id}@test.com",
        "password": "testpassword123",
        "canvas_username": f"testuser_{test_user_id}",
        "total_points": 100,
        "current_level": 1
    }
    
    # Create user
    resp = client.post("/db/users", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["user_id"] == test_user_id
    
    # Get user by ID
    resp = client.get(f"/db/users?user_id={test_user_id}")
    assert resp.status_code == 200
    user_data = resp.get_json()
    assert user_data["user_id"] == test_user_id
    assert user_data["total_points"] == 100
    assert user_data["current_level"] == 1
    
    # Cleanup
    client.delete(f"/db/users/{test_user_id}")


def test_get_all_users(client, test_user_id):
    """Test GET /db/users - fetch all users."""
    # Create a test user first
    payload = {
        "user_id": test_user_id,
        "email": f"{test_user_id}@test.com",
        "password": "testpassword123",
        "canvas_username": "alluserstest",
        "total_points": 50,
        "current_level": 0
    }
    client.post("/db/users", json=payload)
    
    # Get all users
    resp = client.get("/db/users")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert any(u["user_id"] == test_user_id for u in data)
    
    # Cleanup
    client.delete(f"/db/users/{test_user_id}")


def test_get_user_not_found(client):
    """Test GET /db/users?user_id=X - user not found."""
    fake_id = f"nonexistent_{uuid.uuid4().hex}"
    resp = client.get(f"/db/users?user_id={fake_id}")
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_create_user_missing_id(client):
    """Test POST /db/users - missing required user_id."""
    payload = {"canvas_username": "nouser"}
    resp = client.post("/db/users", json=payload)
    assert resp.status_code == 400
    assert "user_id" in resp.get_json()["error"]


def test_delete_user(client, test_user_id):
    """Test DELETE /db/users/<user_id> - delete user."""
    # Create user first
    payload = {
        "user_id": test_user_id,
        "email": f"{test_user_id}@test.com",
        "password": "testpassword123",
        "canvas_username": "deletetest",
        "total_points": 0,
        "current_level": 0
    }
    client.post("/db/users", json=payload)
    
    # Delete user
    resp = client.delete(f"/db/users/{test_user_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "deleted"
    assert data["user_id"] == test_user_id
    
    # Verify deleted
    resp = client.get(f"/db/users?user_id={test_user_id}")
    assert resp.status_code == 404


def test_delete_user_not_found(client):
    """Test DELETE /db/users/<user_id> - user not found."""
    fake_id = f"nonexistent_{uuid.uuid4().hex}"
    resp = client.delete(f"/db/users/{fake_id}")
    assert resp.status_code == 404
    assert "error" in resp.get_json()
