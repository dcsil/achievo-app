"""Pytest tests for /db/assignments API endpoints."""
import pytest
from datetime import datetime, timedelta


def test_get_all_assignments(client, monkeypatch):
    """Test GET /db/assignments - fetch all assignments."""
    assignments = [
        {"assignment_id": "a1", "title": "Homework 1", "course_id": "c1", "due_date": "2025-12-01"},
        {"assignment_id": "a2", "title": "Essay", "course_id": "c2", "due_date": "2025-12-15"},
    ]
    
    class StubAssignmentsRepo:
        def fetch_all(self):
            return assignments
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    resp = client.get("/db/assignments")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_assignments_with_filters(client, monkeypatch):
    """Test GET /db/assignments with filters."""
    assignments = [
        {"assignment_id": "a1", "title": "Homework 1", "course_id": "c1"},
        {"assignment_id": "a2", "title": "Essay", "course_id": "c2"},
    ]
    
    class StubAssignmentsRepo:
        def fetch_with_filters(self, **kwargs):
            filtered = assignments
            if kwargs.get("course_id"):
                filtered = [a for a in filtered if a["course_id"] == kwargs["course_id"]]
            return filtered
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    resp = client.get("/db/assignments?course_id=c1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["course_id"] == "c1"


def test_create_assignment(client, monkeypatch):
    """Test POST /db/assignments - create assignment."""
    created = []
    
    class StubAssignmentsRepo:
        def create(self, **kwargs):
            created.append(kwargs)
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    payload = {
        "assignment_id": "new_assign",
        "course_id": "c1",
        "title": "New Assignment",
        "due_date": "2025-12-20",
        "completion_points": 100
    }
    
    resp = client.post("/db/assignments", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["assignment_id"] == "new_assign"
    assert len(created) == 1


def test_create_assignment_missing_fields(client):
    """Test POST /db/assignments - missing required fields."""
    payload = {
        "assignment_id": "a1",
        "title": "No course"
        # Missing course_id and due_date
    }
    
    resp = client.post("/db/assignments", json=payload)
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"]


def test_update_assignment(client, monkeypatch):
    """Test PUT /db/assignments/<assignment_id> - update assignment."""
    class StubAssignmentsRepo:
        def update(self, **kwargs):
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    payload = {"title": "Updated Title"}
    
    resp = client.put("/db/assignments/a1", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "updated"
    assert data["assignment_id"] == "a1"


def test_update_assignment_no_fields(client):
    """Test PUT /db/assignments/<assignment_id> - no fields to update."""
    resp = client.put("/db/assignments/a1", json={})
    assert resp.status_code == 400
    assert "At least one field" in resp.get_json()["error"]


def test_update_assignment_not_found(client, monkeypatch):
    """Test PUT /db/assignments/<assignment_id> - assignment not found."""
    class StubAssignmentsRepo:
        def update(self, **kwargs):
            return False
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    payload = {"title": "Updated"}
    
    resp = client.put("/db/assignments/nonexistent", json=payload)
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_delete_assignment(client, monkeypatch):
    """Test DELETE /db/assignments/<assignment_id> - delete assignment."""
    class StubAssignmentsRepo:
        def delete(self, assignment_id):
            return assignment_id == "a1"
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    resp = client.delete("/db/assignments/a1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "deleted"
    assert data["assignment_id"] == "a1"


def test_delete_assignment_not_found(client, monkeypatch):
    """Test DELETE /db/assignments/<assignment_id> - assignment not found."""
    class StubAssignmentsRepo:
        def delete(self, assignment_id):
            return False
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    resp = client.delete("/db/assignments/nonexistent")
    assert resp.status_code == 404
    assert "error" in resp.get_json()
