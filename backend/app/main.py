from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
from services.pdf_extractor import extract_events_from_pdf, extract_tasks_from_pdf

UPLOAD_FOLDER = "backend/app/storage/uploads"
ALLOWED_EXTENSIONS = {"pdf"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/extract/events", methods=["POST"])
def extract_events():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        result = extract_events_from_pdf(filepath)
        return result, 200, {"Content-Type": "application/json"}
    return jsonify({"error": "Invalid file"}), 400

@app.route("/extract/tasks", methods=["POST"])
def extract_tasks():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        result = extract_tasks_from_pdf(filepath)
        return result, 200, {"Content-Type": "application/json"}
    return jsonify({"error": "Invalid file"}), 400

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=5000)