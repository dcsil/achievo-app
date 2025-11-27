import pytest
from datetime import datetime
from app.services import read_timetable

@pytest.fixture
def mock_courses():
    return [
        {
            "course_id": "MATH101",
            "user_id": "user1",
            "course_name": "MATH101",
            "course_code": "MATH101",
            "canvas_course_id": "",
            "date_imported_at": datetime.now().isoformat(),
            "term": "2025 Fall",
            "color": "",
            "meeting_sessions": [
                {"day": "Monday", "time": "09:00 - 10:00"},
                {"day": "Wednesday", "time": "09:00 - 10:00"}
            ]
        }
    ]

def test_generate_tasks_for_courses(mock_courses):
    start_date = datetime(2025, 9, 1)
    end_date = datetime(2025, 9, 7)
    breaks = []
    holidays = []
    tasks = read_timetable.generate_tasks_for_courses(
        mock_courses, "user1", "assign1", start_date, end_date, breaks, holidays
    )
    assert isinstance(tasks, list)
    assert all("task_id" in t for t in tasks)
    assert all(t["user_id"] == "user1" for t in tasks)
    assert all(t["course_id"] == "MATH101" for t in tasks)

def test_parse_time_range():
    start, end = read_timetable.parse_time_range("09:00 - 10:00")
    assert start.hour == 9 and end.hour == 10

def test_extract_timetable_courses(monkeypatch):
    # Patch extract_tables_from_pdf to return a mock table
    def mock_extract_tables_from_pdf(pdf_path):
        return [
            [
                ["", "Monday", "Wednesday"],
                ["MATH101", "MATH101\n09:00 - 10:00", "MATH101\n09:00 - 10:00"]
            ]
        ]
    monkeypatch.setattr(read_timetable, "extract_tables_from_pdf", mock_extract_tables_from_pdf)
    courses = read_timetable.extract_timetable_courses("dummy.pdf", "user1", "2025 Fall")
    assert isinstance(courses, list)
    assert courses[0]["course_code"] == "MATH101"
    assert any(session["day"] == "Monday" for session in courses[0]["meeting_sessions"])
