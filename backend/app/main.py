from flask import Flask, request, jsonify
import os
import sys
from pathlib import Path
from datetime import datetime
import uuid
import random

backend_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(backend_dir)

from werkzeug.utils import secure_filename
# from services.pdf_extractor import extract_events_from_pdf, extract_tasks_from_pdf
# from utils.file_utils import handle_file_upload
from database.users_repository import UsersRepository
from database.tasks_repository import TasksRepository
from database.assignments_repository import AssignmentsRepository
from database.user_blind_boxes_repository import UserBlindBoxesRepository
from database.blind_box_series_repository import BlindBoxSeriesRepository
from database.blind_box_figures_repository import BlindBoxFiguresRepository

UPLOAD_FOLDER = "backend/app/storage/uploads"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# @app.route("/extract/events", methods=["POST"])
# def extract_events():
#     filepath, error_response = handle_file_upload(request, app.config["UPLOAD_FOLDER"])
#     if error_response:
#         return error_response
#     result = extract_events_from_pdf(filepath)
#     return result, 200, {"Content-Type": "application/json"}

# @app.route("/extract/tasks", methods=["POST"])
# def extract_tasks():
#     filepath, error_response = handle_file_upload(request, app.config["UPLOAD_FOLDER"])
#     if error_response:
#         return error_response
#     result = extract_tasks_from_pdf(filepath)
#     return result, 200, {"Content-Type": "application/json"}

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

# ---------- TASKS ROUTES ----------
@app.route("/db/tasks", methods=["GET"])
def get_db_tasks():
    try:
        user_id = request.args.get("user_id")
        scheduled_start_at = request.args.get("scheduled_start_at")
        scheduled_end_at = request.args.get("scheduled_end_at")
        assignment_id = request.args.get("assignment_id")
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        repo = TasksRepository()
        tasks = repo.fetch_by_user(
            user_id=user_id,
            scheduled_start_at=scheduled_start_at,
            scheduled_end_at=scheduled_end_at,
            assignment_id=assignment_id
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
        
        # First, get the task to retrieve assignment_id and reward_points
        task = task_repo.fetch_by_id(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        
        # Complete the task
        task_repo.complete_task(task_id)
        
        assignment_id = task.get("assignment_id")
        reward_points = task.get("reward_points", 0)
        
        # Check if there's an assignment and if all tasks are completed
        if assignment_id:
            uncompleted_tasks = task_repo.fetch_uncompleted_by_assignment(assignment_id)
            
            # If no uncompleted tasks remain, complete the assignment
            if len(uncompleted_tasks) == 0:
                assignment_repo.complete_assignment(assignment_id)
                assignment = assignment_repo.fetch_by_id(assignment_id)
                completion_points = assignment.get("completion_points", 0) if assignment else 0
                
                return jsonify({
                    "status": "completed",
                    "task_id": task_id,
                    "assignment_completed": True,
                    "assignment_id": assignment_id,
                    "points_earned": completion_points
                }), 200
        
        # Task completed but assignment not complete yet
        return jsonify({
            "status": "completed",
            "task_id": task_id,
            "assignment_completed": False,
            "points_earned": reward_points
        }), 200
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

# ---------- BLIND BOX ROUTES ----------
@app.route("/db/users/<user_id>/figures", methods=["GET"])
def get_user_figures(user_id):
    try:
        repo = UserBlindBoxesRepository()
        figures = repo.fetch_by_user(user_id)
        return jsonify(figures), 200
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

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=5000)