from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path
from datetime import datetime
import uuid
import random
import json
from typing import List, Dict, Optional

backend_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(backend_dir)

from werkzeug.utils import secure_filename
from app.utils.file_utils import handle_file_upload, extract_tables_from_pdf
from dateutil.parser import parse as date_parse
from app.services.read_timetable import extract_timetable_courses, generate_tasks_for_courses
from app.services.read_syllabi import extract_tasks_assignments_from_pdf, generate_assignment_microtasks

from database.users_repository import UsersRepository
from database.tasks_repository import TasksRepository
from database.assignments_repository import AssignmentsRepository
from database.courses_repository import CoursesRepository
from database.user_blind_boxes_repository import UserBlindBoxesRepository
from database.blind_box_series_repository import BlindBoxSeriesRepository
from database.blind_box_figures_repository import BlindBoxFiguresRepository

# ---------------- Gamification / Progress Helper Functions -----------------

def _calculate_assignment_progress_for_user(user_id: str, assignments: List[Dict]) -> List[Dict]:
    """Augment assignment rows with task_count and completed_task_count for a given user.

    NOTE: This implementation performs per-assignment queries and is O(n) over assignments.
    For larger datasets, consider adding aggregate SQL views or Supabase RPC functions.
    """
    task_repo = TasksRepository()
    augmented: List[Dict] = []
    for assign in assignments:
        assignment_id = assign.get("assignment_id")
        tasks = task_repo.fetch_by_user(user_id=user_id, assignment_id=assignment_id)
        task_count = len(tasks)
        completed_task_count = sum(1 for t in tasks if t.get("is_completed"))
        percent = int(round((completed_task_count / task_count) * 100)) if task_count else (100 if assign.get("is_complete") else 0)
        augmented.append({
            **assign,
            "task_count": task_count,
            "completed_task_count": completed_task_count,
            "percent_complete": percent,
        })
    return augmented


def _calculate_course_progress(user_id: str, courses: List[Dict]) -> List[Dict]:
    """Generate progress summary for each course for the given user.

    Progress is computed from assignments and their tasks. This is a simplified roll-up.
    """
    assign_repo = AssignmentsRepository()
    task_repo = TasksRepository()
    course_progress: List[Dict] = []
    for course in courses:
        course_id = course.get("course_id")
        assignments = assign_repo.fetch_with_filters(course_id=course_id)
        # Per-assignment stats for the user
        assignment_stats = _calculate_assignment_progress_for_user(user_id, assignments)
        assignment_count = len(assignment_stats)
        completed_assignments = sum(1 for a in assignment_stats if a.get("is_complete") or a.get("percent_complete") == 100)
        # Task aggregation
        tasks_for_course = task_repo.fetch_by_user(user_id=user_id)
        tasks_for_course = [t for t in tasks_for_course if t.get("course_id") == course_id]
        task_count = len(tasks_for_course)
        completed_task_count = sum(1 for t in tasks_for_course if t.get("is_completed"))
        # Simple blended progress metric
        overall_percent = 0
        if assignment_count:
            overall_percent = int(round((completed_assignments / assignment_count) * 100))
        # If tasks exist, weight task completion (average of assignment % and task %)
        if task_count:
            task_percent = int(round((completed_task_count / task_count) * 100)) if task_count else 0
            overall_percent = int(round((overall_percent + task_percent) / 2))
        course_progress.append({
            "course_id": course_id,
            "course_name": course.get("course_name"),
            "color": course.get("color"),
            "assignment_count": assignment_count,
            "completed_assignment_count": completed_assignments,
            "task_count": task_count,
            "completed_task_count": completed_task_count,
            "overall_percent": overall_percent,
        })
    return course_progress


def _compute_level_progress(total_points: int, current_level: int) -> Dict:
    """Compute level progress info using static threshold mapping.

    In future, move thresholds to DB (e.g., level_thresholds table) and query dynamically.
    """
    # Example static thresholds (min points to reach level). Expand as needed.
    thresholds = {
        0: 0,
        1: 100,
        2: 250,
        3: 500,
        4: 900,
        5: 1400,
        6: 2000,
        7: 2700,
        8: 3500,
        9: 4400,
        10: 5400,
    }
    # Determine current level min and next level threshold
    current_min = thresholds.get(current_level, total_points)
    next_level = current_level + 1
    next_min = thresholds.get(next_level)
    if next_min is None:  # Max level reached
        return {
            "current_level": current_level,
            "next_level": None,
            "next_level_points": None,
            "progress_percent": 100,
            "points_into_level": total_points - current_min,
            "points_required_for_next": 0,
        }
    span = max(next_min - current_min, 1)
    progress_percent = int(round(((total_points - current_min) / span) * 100))
    progress_percent = max(0, min(progress_percent, 100))
    return {
        "current_level": current_level,
        "next_level": next_level,
        "next_level_points": next_min,
        "progress_percent": progress_percent,
        "points_into_level": max(total_points - current_min, 0),
        "points_required_for_next": max(next_min - total_points, 0),
    }

UPLOAD_FOLDER = "backend/app/storage/uploads"

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "backend/app/storage/uploads"

# ---------- DB ROUTES ----------
@app.route("/db/users", methods=["GET"])
def get_db_users():
    try:
        user_id = request.args.get("user_id")
        repo = UsersRepository()
        if user_id:
            user = repo.fetch_by_id(user_id)
            if user is None:
                return jsonify({"error": "user not found"}), 404
            return jsonify(user), 200
        else:
            users = repo.fetch_all()
            return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/users", methods=["POST"])
def post_db_user():
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    canvas_username = payload.get("canvas_username")
    total_points = payload.get("total_points", 0)
    current_level = payload.get("current_level", 0)

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        UsersRepository().create(user_id=user_id, canvas_username=canvas_username, total_points=total_points, current_level=current_level)
        return jsonify({"status": "created", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/users/<user_id>", methods=["DELETE"])
def delete_db_user(user_id):
    try:
        repo = UsersRepository()
        deleted = repo.delete(user_id)
        if deleted:
            return jsonify({"status": "deleted", "user_id": user_id}), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- TASKS ROUTES ----------
@app.route("/db/tasks", methods=["GET"])
def get_db_tasks():
    try:
        user_id = request.args.get("user_id")
        scheduled_start_at = request.args.get("scheduled_start_at")
        scheduled_end_at = request.args.get("scheduled_end_at")
        assignment_id = request.args.get("assignment_id")
        is_completed_str = request.args.get("is_completed")
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        is_completed = None
        if is_completed_str is not None:
            is_completed = is_completed_str.lower()
        
        repo = TasksRepository()
        tasks = repo.fetch_by_user(
            user_id=user_id,
            scheduled_start_at=scheduled_start_at,
            scheduled_end_at=scheduled_end_at,
            assignment_id=assignment_id,
            is_completed=is_completed
        )
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/tasks", methods=["POST"])
def post_db_task():
    payload = request.get_json() or {}
    task_id = payload.get("task_id")
    user_id = payload.get("user_id")
    description = payload.get("description")
    task_type = payload.get("type")
    assignment_id = payload.get("assignment_id")
    course_id = payload.get("course_id")
    scheduled_start_at = payload.get("scheduled_start_at")
    scheduled_end_at = payload.get("scheduled_end_at")
    is_completed = payload.get("is_completed", False)
    reward_points = payload.get("reward_points", 0)

    if not task_id or not user_id or not description or not task_type:
        return jsonify({"error": "task_id, user_id, description, and type are required"}), 400

    try:
        TasksRepository().create(
            task_id=task_id,
            user_id=user_id,
            description=description,
            type=task_type,
            assignment_id=assignment_id,
            course_id=course_id,
            scheduled_start_at=scheduled_start_at,
            scheduled_end_at=scheduled_end_at,
            is_completed=is_completed,
            reward_points=reward_points
        )
        return jsonify({"status": "created", "task_id": task_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/tasks/<task_id>", methods=["PUT"])
def put_db_task(task_id):
    payload = request.get_json() or {}
    description = payload.get("description")
    scheduled_start_at = payload.get("scheduled_start_at")
    scheduled_end_at = payload.get("scheduled_end_at")

    if description is None and scheduled_start_at is None and scheduled_end_at is None:
        return jsonify({"error": "At least one field (description, scheduled_start_at, scheduled_end_at) is required"}), 400

    try:
        repo = TasksRepository()
        updated = repo.update(
            task_id=task_id,
            description=description,
            scheduled_start_at=scheduled_start_at,
            scheduled_end_at=scheduled_end_at
        )
        if updated:
            return jsonify({"status": "updated", "task_id": task_id}), 200
        else:
            return jsonify({"error": "Task not found or no changes made"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/tasks/<task_id>/complete", methods=["POST"])
def complete_db_task(task_id):
    try:
        task_repo = TasksRepository()
        assignment_repo = AssignmentsRepository()
        users_repo = UsersRepository()
        
        # First, get the task to retrieve assignment_id, reward_points, and user_id
        task = task_repo.fetch_by_id(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        
        # Complete the task
        task_repo.complete_task(task_id)
        
        assignment_id = task.get("assignment_id")
        reward_points = task.get("reward_points", 0)
        user_id = task.get("user_id")
        
        # Check if there's an assignment and if all tasks are completed
        if assignment_id:
            uncompleted_tasks = task_repo.fetch_uncompleted_by_assignment(assignment_id)
            
            if len(uncompleted_tasks) == 0:
                assignment_repo.complete_assignment(assignment_id)
                assignment = assignment_repo.fetch_by_id(assignment_id)
                completion_points = assignment.get("completion_points", 0) if assignment else 0
                
                if user_id:
                    users_repo.update_points(user_id, completion_points)
                
                return jsonify({
                    "status": "completed",
                    "task_id": task_id,
                    "assignment_completed": True,
                    "assignment_id": assignment_id,
                    "points_earned": completion_points
                }), 200
        
        if user_id:
            users_repo.update_points(user_id, reward_points)
        
        return jsonify({
            "status": "completed",
            "task_id": task_id,
            "assignment_completed": False,
            "points_earned": reward_points
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/tasks/<task_id>", methods=["DELETE"])
def delete_db_task(task_id):
    try:
        repo = TasksRepository()
        deleted = repo.delete(task_id)
        if deleted:
            return jsonify({"status": "deleted", "task_id": task_id}), 200
        else:
            return jsonify({"error": "Task not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- ASSIGNMENTS ROUTES ----------
@app.route("/db/assignments", methods=["GET"])
def get_db_assignments():
    try:
        due_date = request.args.get("due_date")
        title = request.args.get("title")
        course_id = request.args.get("course_id")
        
        repo = AssignmentsRepository()
        
        # If any filters are provided, use fetch_with_filters
        if due_date or title or course_id:
            assignments = repo.fetch_with_filters(
                due_date=due_date,
                title=title,
                course_id=course_id
            )
        else:
            assignments = repo.fetch_all()
        
        return jsonify(assignments), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/assignments", methods=["POST"])
def post_db_assignment():
    payload = request.get_json() or {}
    assignment_id = payload.get("assignment_id")
    course_id = payload.get("course_id")
    title = payload.get("title")
    due_date = payload.get("due_date")
    completion_points = payload.get("completion_points", 0)
    is_complete = payload.get("is_complete", False)

    if not assignment_id or not course_id or not title or not due_date:
        return jsonify({"error": "assignment_id, course_id, title, and due_date are required"}), 400

    try:
        AssignmentsRepository().create(
            assignment_id=assignment_id,
            course_id=course_id,
            title=title,
            due_date=due_date,
            completion_points=completion_points,
            is_complete=is_complete
        )
        return jsonify({"status": "created", "assignment_id": assignment_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/assignments/<assignment_id>", methods=["PUT"])
def put_db_assignment(assignment_id):
    payload = request.get_json() or {}
    title = payload.get("title")
    due_date = payload.get("due_date")

    if title is None and due_date is None:
        return jsonify({"error": "At least one field (title, due_date) is required"}), 400

    try:
        repo = AssignmentsRepository()
        updated = repo.update(
            assignment_id=assignment_id,
            title=title,
            due_date=due_date
        )
        if updated:
            return jsonify({"status": "updated", "assignment_id": assignment_id}), 200
        else:
            return jsonify({"error": "Assignment not found or no changes made"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/assignments/<assignment_id>", methods=["DELETE"])
def delete_db_assignment(assignment_id):
    try:
        repo = AssignmentsRepository()
        deleted = repo.delete(assignment_id)
        if deleted:
            return jsonify({"status": "deleted", "assignment_id": assignment_id}), 200
        else:
            return jsonify({"error": "Assignment not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- COURSES ROUTES ----------
@app.route("/db/courses", methods=["GET"])
def get_db_courses():
    try:
        course_id = request.args.get("course_id")
        repo = CoursesRepository()
        
        if course_id:
            course = repo.fetch_by_id(course_id)
            if course is None:
                return jsonify({"error": "Course not found"}), 404
            return jsonify(course), 200
        else:
            courses = repo.fetch_all()
            return jsonify(courses), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/db/courses", methods=["POST"])
def post_db_course():
    """Create a course record.

    Body JSON fields:
      - course_id (str, required)
      - user_id (str, required)
      - course_name (str, required)
      - course_code (str, optional)
      - canvas_course_id (str, optional)
      - term (str, optional)
      - color (str, optional)
    """
    payload = request.get_json() or {}
    course_id = payload.get("course_id")
    user_id = payload.get("user_id")
    course_name = payload.get("course_name")
    course_code = payload.get("course_code")
    canvas_course_id = payload.get("canvas_course_id")
    term = payload.get("term")
    color = payload.get("color")

    if not course_id or not user_id or not course_name:
        return jsonify({"error": "course_id, user_id, and course_name are required"}), 400

    try:
        repo = CoursesRepository()
        repo.create(
            course_id=course_id,
            user_id=user_id,
            course_name=course_name,
            course_code=course_code,
            canvas_course_id=canvas_course_id,
            term=term,
            color=color,
        )
        return jsonify({"status": "created", "course_id": course_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- BLIND BOX ROUTES ----------
@app.route("/db/blind-box-series", methods=["POST"])
def post_blind_box_series():
    payload = request.get_json() or {}
    series_id = payload.get("series_id")
    name = payload.get("name")
    description = payload.get("description")
    cost_points = payload.get("cost_points", 0)
    release_date = payload.get("release_date")

    if not series_id or not name:
        return jsonify({"error": "series_id and name are required"}), 400

    try:
        BlindBoxSeriesRepository().create(
            series_id=series_id,
            name=name,
            description=description,
            cost_points=cost_points,
            release_date=release_date
        )
        return jsonify({"status": "created", "series_id": series_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/blind-box-series/<series_id>", methods=["DELETE"])
def delete_blind_box_series(series_id):
    try:
        repo = BlindBoxSeriesRepository()
        deleted = repo.delete(series_id)
        if deleted:
            return jsonify({"status": "deleted", "series_id": series_id}), 200
        else:
            return jsonify({"error": "Series not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/blind-box-figures", methods=["POST"])
def post_blind_box_figure():
    payload = request.get_json() or {}
    figure_id = payload.get("figure_id")
    series_id = payload.get("series_id")
    name = payload.get("name")
    rarity = payload.get("rarity")
    weight = payload.get("weight", 1.0)

    if not figure_id or not series_id or not name:
        return jsonify({"error": "figure_id, series_id, and name are required"}), 400

    try:
        BlindBoxFiguresRepository().create(
            figure_id=figure_id,
            series_id=series_id,
            name=name,
            rarity=rarity,
            weight=weight
        )
        return jsonify({"status": "created", "figure_id": figure_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/blind-box-figures/<figure_id>", methods=["DELETE"])
def delete_blind_box_figure(figure_id):
    try:
        repo = BlindBoxFiguresRepository()
        deleted = repo.delete(figure_id)
        if deleted:
            return jsonify({"status": "deleted", "figure_id": figure_id}), 200
        else:
            return jsonify({"error": "Figure not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


 


@app.route("/db/blind-boxes/purchase", methods=["POST"])
def purchase_blind_box():
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    series_id = payload.get("series_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        users_repo = UsersRepository()
        series_repo = BlindBoxSeriesRepository()
        figures_repo = BlindBoxFiguresRepository()
        user_boxes_repo = UserBlindBoxesRepository()
        
        # Get user's current points
        user = users_repo.fetch_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_points = user.get("total_points", 0)
        
        # If series_id is provided, use it; otherwise, select from affordable series
        if series_id:
            series = series_repo.fetch_by_id(series_id)
            if not series:
                return jsonify({"error": "Series not found"}), 404
            
            series_cost = series.get("cost_points", 0)
            if user_points < series_cost:
                return jsonify({"error": "Insufficient points"}), 400
        else:
            # Get all affordable series
            affordable_series = series_repo.fetch_affordable_series(user_points)
            
            if not affordable_series:
                return jsonify({"error": "No affordable blind box series available"}), 400
            
            # Select a random series (you could also let the frontend choose)
            series = random.choice(affordable_series)
            series_id = series.get("series_id")
            series_cost = series.get("cost_points", 0)
        
        # Select a random figure from the series
        selected_figure = figures_repo.select_random_figure(series_id)
        
        if not selected_figure:
            return jsonify({"error": "No figures available in this series"}), 404
        
        # Deduct points from user
        users_repo.update_points(user_id, -series_cost)
        
        # Create purchase record
        purchase_id = str(uuid.uuid4())
        purchased_at = datetime.now().isoformat()
        
        user_boxes_repo.create(
            purchase_id=purchase_id,
            user_id=user_id,
            series_id=series_id,
            purchased_at=purchased_at,
            opened_at=purchased_at,  # Automatically opened
            awarded_figure_id=selected_figure.get("figure_id")
        )
        
        # Get updated user points
        updated_user = users_repo.fetch_by_id(user_id)
        new_points = updated_user.get("total_points", 0)
        
        return jsonify({
            "status": "purchased",
            "purchase_id": purchase_id,
            "series_id": series_id,
            "series_name": series.get("name"),
            "cost_points": series_cost,
            "awarded_figure": {
                "figure_id": selected_figure.get("figure_id"),
                "name": selected_figure.get("name"),
                "rarity": selected_figure.get("rarity")
            },
            "remaining_points": new_points
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/user-blind-boxes/<purchase_id>", methods=["DELETE"])
def delete_user_blind_box(purchase_id):
    try:
        repo = UserBlindBoxesRepository()
        deleted = repo.delete(purchase_id)
        if deleted:
            return jsonify({"status": "deleted", "purchase_id": purchase_id}), 200
        else:
            return jsonify({"error": "Purchase not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- Additional Gamification / Progress Endpoints ----------------

@app.route("/db/blind-box-series", methods=["GET"])
def get_blind_box_series():
    """List all blind box series."""
    try:
        series = BlindBoxSeriesRepository().fetch_all()
        return jsonify(series), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/blind-box-series/affordable", methods=["GET"])
def get_affordable_blind_box_series():
    """Return blind box series affordable for a given user based on their current points."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    try:
        users_repo = UsersRepository()
        series_repo = BlindBoxSeriesRepository()
        user = users_repo.fetch_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_points = user.get("total_points", 0)
        affordable = series_repo.fetch_affordable_series(user_points)
        return jsonify({
            "user_id": user_id,
            "user_points": user_points,
            "affordable_series": affordable
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/blind-boxes/preview", methods=["GET"])
def preview_blind_boxes():
    """Preview blind box purchase options (affordable series + current points)."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    try:
        users_repo = UsersRepository()
        series_repo = BlindBoxSeriesRepository()
        user = users_repo.fetch_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_points = user.get("total_points", 0)
        affordable = series_repo.fetch_affordable_series(user_points)
        return jsonify({
            "user_id": user_id,
            "user_points": user_points,
            "affordable_series": affordable
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/users/<user_id>/figures", methods=["GET"])
def get_user_figures(user_id):  # redefined with filtering/pagination support
    limit = request.args.get("limit", type=int) or 50
    offset = request.args.get("offset", type=int) or 0
    rarity = request.args.get("rarity")
    series_id = request.args.get("series_id")
    try:
        repo = UserBlindBoxesRepository()
        figures = repo.fetch_by_user(user_id)
        # Filtering
        if rarity:
            figures = [f for f in figures if f.get("figure_rarity") == rarity]
        if series_id:
            figures = [f for f in figures if f.get("series_id") == series_id]
        total = len(figures)
        paged = figures[offset: offset + limit]
        return jsonify({
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": paged
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/assignments/progress", methods=["GET"])
def get_assignment_progress():
    user_id = request.args.get("user_id")
    course_id = request.args.get("course_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    try:
        repo = AssignmentsRepository()
        if course_id:
            assignments = repo.fetch_with_filters(course_id=course_id)
        else:
            assignments = repo.fetch_all()
        augmented = _calculate_assignment_progress_for_user(user_id, assignments)
        return jsonify(augmented), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/courses/progress", methods=["GET"])
def get_courses_progress():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    try:
        courses_repo = CoursesRepository()
        courses = courses_repo.fetch_all()
        # Filter courses for user (client was doing this previously)
        user_courses = [c for c in courses if c.get("user_id") == user_id]
        progress = _calculate_course_progress(user_id, user_courses)
        return jsonify(progress), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/users/<user_id>/progress", methods=["GET"])
def get_user_progress(user_id):
    try:
        users_repo = UsersRepository()
        user = users_repo.fetch_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        info = _compute_level_progress(user.get("total_points", 0), user.get("current_level", 0))
        return jsonify({
            "user_id": user_id,
            "total_points": user.get("total_points", 0),
            **info
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/db/dashboard", methods=["GET"])
def get_dashboard():
    """Batch endpoint aggregating user, tasks (today/upcoming), course progress, and counts.

    This reduces number of round-trips required by the Home screen.
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    try:
        users_repo = UsersRepository()
        tasks_repo = TasksRepository()
        courses_repo = CoursesRepository()
        user = users_repo.fetch_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        # Tasks (incomplete only by default)
        tasks = tasks_repo.fetch_by_user(user_id=user_id, is_completed=False)
        today = datetime.utcnow().date()
        today_tasks = []
        upcoming_tasks = []
        for t in tasks:
            end_at = t.get("scheduled_end_at")
            if not end_at:
                continue
            try:
                dt = datetime.fromisoformat(end_at.replace("Z", ""))
            except Exception:
                continue
            if dt.date() == today:
                today_tasks.append(t)
            elif dt.date() > today:
                upcoming_tasks.append(t)
        # Course progress
        courses = courses_repo.fetch_all()
        user_courses = [c for c in courses if c.get("user_id") == user_id]
        course_progress = _calculate_course_progress(user_id, user_courses)
        progress_info = _compute_level_progress(user.get("total_points", 0), user.get("current_level", 0))
        # Placeholder notifications count (future implementation)
        notifications_unread_count = 0
        return jsonify({
            "user": user,
            "tasks": {
                "today": today_tasks,
                "upcoming": upcoming_tasks
            },
            "courses": course_progress,
            "level_progress": progress_info,
            "notifications_unread_count": notifications_unread_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- TIMETABLE ROUTES ----------
@app.route("/api/timetable/process", methods=["POST"])
def process_timetable():
    """
    Process uploaded timetable PDF and return courses and tasks.
    Only requires PDF file upload - uses hardcoded values from read_timetable.py

    testing:
    curl -X POST http://127.0.0.1:5000/api/timetable/process \
        -F "file=@backend/app/storage/uploads/timetable.pdf"
    """
    try:
        # Handle file upload
        filepath, error_response = handle_file_upload(request, UPLOAD_FOLDER)
        if error_response:
            return error_response
        
        # Use hardcoded values from read_timetable.py
        from app.services.read_timetable import user_id, term, assignment_id, start_date, end_date, breaks, holidays
        
        # Extract courses from PDF using imported function
        courses = extract_timetable_courses(filepath, user_id, term)
        
        # Generate tasks using imported function
        tasks = generate_tasks_for_courses(
            courses, user_id, assignment_id, start_date, end_date, breaks, holidays
        )
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            "status": "success",
            "courses_found": len(courses),
            "tasks_generated": len(tasks),
            "courses": courses,
            "tasks": tasks,
            "config": {
                "user_id": user_id,
                "term": term,
                "assignment_id": assignment_id,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "breaks": [f"{b[0].isoformat()} to {b[1].isoformat()}" for b in breaks],
                "holidays": [h.isoformat() for h in holidays]
            }
        }), 200
        
    except Exception as e:
        print(f"Error processing timetable: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ---------- SYLLABI ROUTES ----------
@app.route("/api/syllabi/process", methods=["POST"])
def process_syllabi():
    """
    Process uploaded syllabi PDF and return assignments with micro-tasks and exam/quiz tasks.
    Requires PDF file upload and optional course_id parameter.

    testing:
    curl -X POST http://127.0.0.1:5000/api/syllabi/process \
        -F "file=@backend/app/storage/uploads/dummy.pdf" \
        -F "course_id=course_123" \
        -F 'busy_intervals=[{"start": "2025-11-13T09:00:00", "end": "2025-11-13T14:00:00"}]'
    """
    try:
        # Handle file upload
        filepath, error_response = handle_file_upload(request, UPLOAD_FOLDER)
        if error_response:
            return error_response
        
        # Get course_id from form data (optional)
        course_id = request.form.get("course_id")
        
        # Extract assignments and tasks from PDF using AI
        extracted_data = extract_tasks_assignments_from_pdf(filepath)
        
        # Add IDs to the extracted data
        from app.services.read_syllabi import add_ids_to_extracted_data, generate_assignment_microtasks_with_ids
        data_with_ids = add_ids_to_extracted_data(extracted_data, course_id=course_id)
        
        # Get busy intervals from form data (optional)
        busy_intervals_json = request.form.get("busy_intervals", "[]")
        try:
            busy_intervals = json.loads(busy_intervals_json)
        except json.JSONDecodeError:
            busy_intervals = []
        
        # Generate micro-tasks for assignments with proper IDs
        assignments_with_micro = generate_assignment_microtasks_with_ids(
            data_with_ids["assignments"], 
            busy_intervals,
            default_micro_task_count=3
        )
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            "status": "success",
            "course_id": course_id,
            "assignments_found": len(assignments_with_micro["assignments"]),
            "tasks_found": len(data_with_ids["tasks"]),
            "total_micro_tasks": sum(len(a["micro_tasks"]) for a in assignments_with_micro["assignments"]),
            "assignments": assignments_with_micro["assignments"],
            "tasks": data_with_ids["tasks"]
        }), 200
        
    except Exception as e:
        print(f"Error processing syllabi: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=5000)