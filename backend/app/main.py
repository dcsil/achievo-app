from flask import Flask, request, jsonify
import os

from werkzeug.utils import secure_filename
from services.pdf_extractor import extract_events_from_pdf, extract_tasks_from_pdf
from utils.file_utils import handle_file_upload

UPLOAD_FOLDER = "backend/app/storage/uploads"


app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER



@app.route("/extract/events", methods=["POST"])
def extract_events():
    filepath, error_response = handle_file_upload(request, app.config["UPLOAD_FOLDER"])
    if error_response:
        return error_response
    result = extract_events_from_pdf(filepath)
    return result, 200, {"Content-Type": "application/json"}

@app.route("/extract/tasks", methods=["POST"])
def extract_tasks():
    filepath, error_response = handle_file_upload(request, app.config["UPLOAD_FOLDER"])
    if error_response:
        return error_response
    result = extract_tasks_from_pdf(filepath)
    return result, 200, {"Content-Type": "application/json"}

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=5000)