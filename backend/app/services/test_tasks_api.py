"""Pytest tests for /db/tasks API endpoints."""
import pytest
import uuid
from datetime import datetime, timedelta


@pytest.fixture
def test_user_id(client):
    """Create a test user and return ID."""
    user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    payload = {
        "user_id": user_id,
        "canvas_username": f"taskuser_{user_id}",
        "total_points": 100,
        "current_level": 1
    }
    client.post("/db/users", json=payload)
    yield user_id
    # Cleanup
    client.delete(f"/db/users/{user_id}")


@pytest.fixture
def test_assignment_id(client):
    """Create a test assignment and return ID."""
    assignment_id = f"test_assign_{uuid.uuid4().hex[:8]}"
    payload = {
        "assignment_id": assignment_id,
        "course_id": "test_course",
        "title": "Test Assignment",
        "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
        "completion_points": 50
    }
    client.post("/db/assignments", json=payload)
    yield assignment_id
    # Cleanup
    client.delete(f"/db/assignments/{assignment_id}")


def test_get_tasks_missing_user_id(client):
    """Test GET /db/tasks - missing required user_id."""
    resp = client.get("/db/tasks")
    assert resp.status_code == 400
    assert "user_id" in resp.get_json()["error"]


def test_create_and_get_task(client, test_user_id):
    """Test POST /db/tasks - create task and GET to verify."""
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    payload = {
        "task_id": task_id,
        "user_id": test_user_id,
        "description": "Test task",
        "type": "general",
        "reward_points": 10
    }
    
    # Create task
    resp = client.post("/db/tasks", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["task_id"] == task_id
    
    # Get tasks for user
    resp = client.get(f"/db/tasks?user_id={test_user_id}")
    assert resp.status_code == 200
    tasks = resp.get_json()
    assert isinstance(tasks, list)
    assert any(t["task_id"] == task_id for t in tasks)
    
    # Cleanup
    client.delete(f"/db/tasks/{task_id}")


def test_create_task_missing_fields(client, test_user_id):
    """Test POST /db/tasks - missing required fields."""
    payload = {
        "task_id": "t1",
        "user_id": test_user_id,
        "description": "Task"
        # Missing type field
    }
    
    resp = client.post("/db/tasks", json=payload)
    assert resp.status_code == 400
    assert "type" in resp.get_json()["error"]


def test_update_task(client, test_user_id):
    """Test PUT /db/tasks/<task_id> - update task."""
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    
    # Create task
    payload = {
        "task_id": task_id,
        "user_id": test_user_id,
        "description": "Original description",
        "type": "general",
        "reward_points": 5
    }
    client.post("/db/tasks", json=payload)
    
    # Update task
    update_payload = {"description": "Updated description"}
    resp = client.put(f"/db/tasks/{task_id}", json=update_payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "updated"
    
    # Cleanup
    client.delete(f"/db/tasks/{task_id}")


def test_update_task_no_fields(client):
    """Test PUT /db/tasks/<task_id> - no fields to update."""
    resp = client.put("/db/tasks/t1", json={})
    assert resp.status_code == 400
    assert "At least one field" in resp.get_json()["error"]


def test_complete_task_basic(client, test_user_id):
    """Test POST /db/tasks/<task_id>/complete - complete task."""
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    
    # Create task
    payload = {
        "task_id": task_id,
        "user_id": test_user_id,
        "description": "Task to complete",
        "type": "general",
        "reward_points": 20
    }
    client.post("/db/tasks", json=payload)
    
    # Complete task
    resp = client.post(f"/db/tasks/{task_id}/complete")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "completed"
    assert data["assignment_completed"] is False
    assert data["points_earned"] == 20
    
    # Cleanup
    client.delete(f"/db/tasks/{task_id}")


def test_complete_task_not_found(client):
    """Test POST /db/tasks/<task_id>/complete - task not found."""
    fake_id = f"nonexistent_{uuid.uuid4().hex}"
    resp = client.post(f"/db/tasks/{fake_id}/complete")
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_delete_task(client, test_user_id):
    """Test DELETE /db/tasks/<task_id> - delete task."""
    task_id = f"test_task_{uuid.uuid4().hex[:8]}"
    
    # Create task
    payload = {
        "task_id": task_id,
        "user_id": test_user_id,
        "description": "Task to delete",
        "type": "general"
    }
    client.post("/db/tasks", json=payload)
    
    # Delete task
    resp = client.delete(f"/db/tasks/{task_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "deleted"
    assert data["task_id"] == task_id


def test_delete_task_not_found(client):
    """Test DELETE /db/tasks/<task_id> - task not found."""
    fake_id = f"nonexistent_{uuid.uuid4().hex}"
    resp = client.delete(f"/db/tasks/{fake_id}")
    assert resp.status_code == 404
    assert "error" in resp.get_json()
    """Test GET /db/tasks?user_id=X - fetch tasks for user."""
    tasks = [
        {"task_id": "t1", "user_id": "u1", "description": "Task 1", "is_completed": False},
        {"task_id": "t2", "user_id": "u1", "description": "Task 2", "is_completed": True},
    ]
    
    class StubTasksRepo:
        def fetch_by_user(self, **kwargs):
            return [t for t in tasks if t["user_id"] == kwargs.get("user_id")]
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.get("/db/tasks?user_id=u1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_tasks_with_filters(client, monkeypatch):
    """Test GET /db/tasks with optional filters."""
    tasks = [
        {"task_id": "t1", "user_id": "u1", "assignment_id": "a1", "is_completed": False},
        {"task_id": "t2", "user_id": "u1", "assignment_id": "a2", "is_completed": False},
    ]
    
    class StubTasksRepo:
        def fetch_by_user(self, **kwargs):
            filtered = [t for t in tasks if t["user_id"] == kwargs.get("user_id")]
            if kwargs.get("assignment_id"):
                filtered = [t for t in filtered if t["assignment_id"] == kwargs.get("assignment_id")]
            return filtered
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.get("/db/tasks?user_id=u1&assignment_id=a1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["assignment_id"] == "a1"


def test_create_task(client, monkeypatch):
    """Test POST /db/tasks - create a new task."""
    created_tasks = []
    
    class StubTasksRepo:
        def create(self, **kwargs):
            created_tasks.append(kwargs)
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    payload = {
        "task_id": "new_task",
        "user_id": "u1",
        "description": "New task",
        "type": "general",
        "reward_points": 10
    }
    
    resp = client.post("/db/tasks", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["task_id"] == "new_task"
    assert len(created_tasks) == 1


def test_create_task_missing_fields(client, monkeypatch):
    """Test POST /db/tasks - missing required fields."""
    class StubTasksRepo:
        def create(self, **kwargs):
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    # Missing type field
    payload = {
        "task_id": "t1",
        "user_id": "u1",
        "description": "Task"
    }
    
    resp = client.post("/db/tasks", json=payload)
    assert resp.status_code == 400
    assert "type" in resp.get_json()["error"]


def test_update_task(client, monkeypatch):
    """Test PUT /db/tasks/<task_id> - update task."""
    class StubTasksRepo:
        def update(self, **kwargs):
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    payload = {"description": "Updated description"}
    
    resp = client.put("/db/tasks/t1", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "updated"
    assert data["task_id"] == "t1"


def test_update_task_no_fields(client):
    """Test PUT /db/tasks/<task_id> - no fields to update."""
    resp = client.put("/db/tasks/t1", json={})
    assert resp.status_code == 400
    assert "At least one field" in resp.get_json()["error"]


def test_complete_task_basic(client, monkeypatch):
    """Test POST /db/tasks/<task_id>/complete - complete task without assignment."""
    task_data = {
        "task_id": "t1",
        "user_id": "u1",
        "assignment_id": None,
        "reward_points": 20,
        "is_completed": False
    }
    
    class StubTasksRepo:
        def fetch_by_id(self, task_id):
            return task_data if task_id == "t1" else None
        def complete_task(self, task_id):
            return True
    
    class StubUsersRepo:
        def update_points(self, user_id, points):
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    
    resp = client.post("/db/tasks/t1/complete")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "completed"
    assert data["assignment_completed"] is False
    assert data["points_earned"] == 20


def test_complete_task_with_assignment(client, monkeypatch):
    """Test POST /db/tasks/<task_id>/complete - complete last task, complete assignment."""
    task_data = {
        "task_id": "t1",
        "user_id": "u1",
        "assignment_id": "a1",
        "reward_points": 10,
        "is_completed": False
    }
    
    assignment_data = {
        "assignment_id": "a1",
        "completion_points": 50
    }
    
    class StubTasksRepo:
        def fetch_by_id(self, task_id):
            return task_data if task_id == "t1" else None
        def complete_task(self, task_id):
            return True
        def fetch_uncompleted_by_assignment(self, assignment_id):
            return []  # No uncompleted tasks left
    
    class StubAssignmentsRepo:
        def complete_assignment(self, assignment_id):
            return True
        def fetch_by_id(self, assignment_id):
            return assignment_data if assignment_id == "a1" else None
    
    class StubUsersRepo:
        def update_points(self, user_id, points):
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    
    resp = client.post("/db/tasks/t1/complete")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "completed"
    assert data["assignment_completed"] is True
    assert data["assignment_id"] == "a1"
    assert data["points_earned"] == 50


def test_complete_task_not_found(client, monkeypatch):
    """Test POST /db/tasks/<task_id>/complete - task not found."""
    class StubTasksRepo:
        def fetch_by_id(self, task_id):
            return None
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.post("/db/tasks/nonexistent/complete")
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_delete_task(client, monkeypatch):
    """Test DELETE /db/tasks/<task_id> - delete task."""
    class StubTasksRepo:
        def delete(self, task_id):
            return task_id == "t1"
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.delete("/db/tasks/t1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "deleted"
    assert data["task_id"] == "t1"


def test_delete_task_not_found(client, monkeypatch):
    """Test DELETE /db/tasks/<task_id> - task not found."""
    class StubTasksRepo:
        def delete(self, task_id):
            return False
    
    import app.main as main
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.delete("/db/tasks/nonexistent")
    assert resp.status_code == 404
    assert "error" in resp.get_json()
