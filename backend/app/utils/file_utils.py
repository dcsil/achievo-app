import os
from flask import request, jsonify
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"pdf"}

UPLOAD_FOLDER = "backend/app/storage/uploads"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_file_upload(request, upload_folder=UPLOAD_FOLDER):
    if "file" not in request.files:
        return None, (jsonify({"error": "No file uploaded"}), 400)
    file = request.files["file"]
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        return filepath, None
    return None, (jsonify({"error": "Invalid file"}), 400)
