"""Pytest tests for progress and dashboard API endpoints."""
import pytest
from datetime import datetime, timedelta


def test_assignment_progress_missing_user(client):
    """Test GET /db/assignments/progress - missing user_id."""
    resp = client.get("/db/assignments/progress")
    assert resp.status_code == 400
    assert "user_id" in resp.get_json()["error"]


def test_assignment_progress_basic(client, monkeypatch):
    """Test GET /db/assignments/progress - calculate progress."""
    assignments = [
        {"assignment_id": "a1", "course_id": "c1", "is_complete": False},
        {"assignment_id": "a2", "course_id": "c1", "is_complete": True},
    ]
    
    tasks_map = {
        "a1": [
            {"task_id": "t1", "is_completed": True},
            {"task_id": "t2", "is_completed": False},
        ],
        "a2": []
    }
    
    class StubAssignmentsRepo:
        def fetch_all(self):
            return assignments
    
    class StubTasksRepo:
        def fetch_by_user(self, user_id, assignment_id=None, **kwargs):
            return tasks_map.get(assignment_id, [])
    
    import app.main as main
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.get("/db/assignments/progress?user_id=u1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 2
    a1 = next(a for a in data if a["assignment_id"] == "a1")
    assert a1["task_count"] == 2
    assert a1["completed_task_count"] == 1
    assert a1["percent_complete"] == 50


def test_courses_progress_missing_user(client):
    """Test GET /db/courses/progress - missing user_id."""
    resp = client.get("/db/courses/progress")
    assert resp.status_code == 400


def test_courses_progress_basic(client, monkeypatch):
    """Test GET /db/courses/progress - calculate course progress."""
    courses = [
        {"course_id": "c1", "user_id": "u1", "course_name": "Math", "color": "#ff0000"},
    ]
    
    assignments = [
        {"assignment_id": "a1", "course_id": "c1", "is_complete": True},
        {"assignment_id": "a2", "course_id": "c1", "is_complete": False},
    ]
    
    tasks = [
        {"task_id": "t1", "user_id": "u1", "course_id": "c1", "is_completed": True},
        {"task_id": "t2", "user_id": "u1", "course_id": "c1", "is_completed": False},
    ]
    
    class StubCoursesRepo:
        def fetch_all(self):
            return courses
    
    class StubAssignmentsRepo:
        def fetch_with_filters(self, course_id=None, **kwargs):
            return [a for a in assignments if a["course_id"] == course_id]
    
    class StubTasksRepo:
        def fetch_by_user(self, user_id, **kwargs):
            return [t for t in tasks if t["user_id"] == user_id]
    
    import app.main as main
    monkeypatch.setattr(main, "CoursesRepository", StubCoursesRepo)
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    
    resp = client.get("/db/courses/progress?user_id=u1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["course_id"] == "c1"
    assert data[0]["assignment_count"] == 2
    assert data[0]["task_count"] == 2


def test_user_progress_not_found(client, monkeypatch):
    """Test GET /db/users/<user_id>/progress - user not found."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return None
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    
    resp = client.get("/db/users/nonexistent/progress")
    assert resp.status_code == 404


def test_user_progress_level_calculation(client, monkeypatch):
    """Test GET /db/users/<user_id>/progress - level progress calculation."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return {"user_id": user_id, "total_points": 300, "current_level": 2}
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    
    resp = client.get("/db/users/u1/progress")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total_points"] == 300
    assert data["current_level"] == 2
    assert data["next_level"] == 3
    # Level 2: 250, Level 3: 500, progress = (300-250)/(500-250) = 50/250 = 20%
    assert data["progress_percent"] == 20


def test_dashboard_missing_user(client):
    """Test GET /db/dashboard - missing user_id."""
    resp = client.get("/db/dashboard")
    assert resp.status_code == 400


def test_dashboard_success(client, monkeypatch):
    """Test GET /db/dashboard - aggregate endpoint."""
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)
    
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return {"user_id": user_id, "total_points": 500, "current_level": 3}
    
    tasks = [
        {"task_id": "t1", "user_id": "u1", "is_completed": False, "scheduled_end_at": today.isoformat()},
        {"task_id": "t2", "user_id": "u1", "is_completed": False, "scheduled_end_at": tomorrow.isoformat()},
    ]
    
    class StubTasksRepo:
        def fetch_by_user(self, user_id, is_completed=None, **kwargs):
            filtered = [t for t in tasks if t["user_id"] == user_id]
            if is_completed is not None:
                # is_completed comes as string "false" from query param
                filtered = [t for t in filtered if t["is_completed"] == (is_completed in [True, "true"])]
            return filtered
    
    courses = [
        {"course_id": "c1", "user_id": "u1", "course_name": "Math", "color": "#ff0000"},
    ]
    
    class StubCoursesRepo:
        def fetch_all(self):
            return courses
    
    class StubAssignmentsRepo:
        def fetch_with_filters(self, **kwargs):
            return []
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    monkeypatch.setattr(main, "TasksRepository", StubTasksRepo)
    monkeypatch.setattr(main, "CoursesRepository", StubCoursesRepo)
    monkeypatch.setattr(main, "AssignmentsRepository", StubAssignmentsRepo)
    
    resp = client.get("/db/dashboard?user_id=u1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "user" in data
    assert data["user"]["user_id"] == "u1"
    assert "tasks" in data
    assert "today" in data["tasks"]
    assert "upcoming" in data["tasks"]
    assert "courses" in data
    assert "level_progress" in data


def test_preview_blind_boxes(client, monkeypatch):
    """Test GET /db/blind-boxes/preview."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return {"user_id": user_id, "total_points": 150}
    
    class StubBlindBoxSeriesRepo:
        def fetch_affordable_series(self, points):
            return [{"series_id": "s1", "cost_points": 100}]
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    
    resp = client.get("/db/blind-boxes/preview?user_id=u1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["user_points"] == 150
    assert len(data["affordable_series"]) == 1
