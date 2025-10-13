from flask import Flask, request, jsonify
import os
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(backend_dir)

from werkzeug.utils import secure_filename
from services.pdf_extractor import extract_events_from_pdf, extract_tasks_from_pdf
from utils.file_utils import handle_file_upload
from database.users_repository import UsersRepository
# from database.users_repository import UsersRepository

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

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=5000)