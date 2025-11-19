"""Pytest tests for /db/courses API endpoints."""
import pytest


def test_get_all_courses(client, monkeypatch):
    """Test GET /db/courses - fetch all courses."""
    courses = [
        {"course_id": "c1", "course_name": "Math 101", "user_id": "u1"},
        {"course_id": "c2", "course_name": "Physics 201", "user_id": "u1"},
    ]
    
    class StubCoursesRepo:
        def fetch_all(self):
            return courses
    
    import app.main as main
    monkeypatch.setattr(main, "CoursesRepository", StubCoursesRepo)
    
    resp = client.get("/db/courses")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_course_by_id(client, monkeypatch):
    """Test GET /db/courses?course_id=X - fetch specific course."""
    course_data = {
        "course_id": "c1",
        "course_name": "Math 101",
        "course_code": "MATH101",
        "user_id": "u1",
        "term": "Fall 2025"
    }
    
    class StubCoursesRepo:
        def fetch_by_id(self, course_id):
            return course_data if course_id == "c1" else None
    
    import app.main as main
    monkeypatch.setattr(main, "CoursesRepository", StubCoursesRepo)
    
    resp = client.get("/db/courses?course_id=c1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["course_id"] == "c1"
    assert data["course_name"] == "Math 101"


def test_get_course_not_found(client, monkeypatch):
    """Test GET /db/courses?course_id=X - course not found."""
    class StubCoursesRepo:
        def fetch_by_id(self, course_id):
            return None
    
    import app.main as main
    monkeypatch.setattr(main, "CoursesRepository", StubCoursesRepo)
    
    resp = client.get("/db/courses?course_id=nonexistent")
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_create_course(client, monkeypatch):
    """Test POST /db/courses - create course."""
    created = []
    
    class StubCoursesRepo:
        def create(self, **kwargs):
            created.append(kwargs)
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "CoursesRepository", StubCoursesRepo)
    
    payload = {
        "course_id": "new_course",
        "user_id": "u1",
        "course_name": "New Course",
        "course_code": "NEW101",
        "term": "Fall 2025",
        "color": "#ff0000"
    }
    
    resp = client.post("/db/courses", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["course_id"] == "new_course"
    assert len(created) == 1
    assert created[0]["course_name"] == "New Course"


def test_create_course_missing_fields(client):
    """Test POST /db/courses - missing required fields."""
    payload = {
        "course_id": "c1",
        "user_id": "u1"
        # Missing course_name
    }
    
    resp = client.post("/db/courses", json=payload)
    assert resp.status_code == 400
    assert "course_name" in resp.get_json()["error"]
