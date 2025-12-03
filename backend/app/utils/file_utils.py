import os
from flask import request, jsonify
from werkzeug.utils import secure_filename
import pdfplumber

ALLOWED_EXTENSIONS = {"pdf"}

UPLOAD_FOLDER = "backend/app/storage/uploads"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_file_upload(request, upload_folder=UPLOAD_FOLDER):
    """Handle file upload with proper absolute path management"""
    if "file" not in request.files:
        return None, (jsonify({"error": "No file provided"}), 400)
    file = request.files["file"]
    if file.filename == "":
        return None, (jsonify({"error": "No file selected"}), 400)
    if not file.filename.lower().endswith(".pdf"):
        return None, (jsonify({"error": "File must be a PDF"}), 400)
    
    # Ensure upload folder is absolute and exists
    abs_upload_folder = os.path.abspath(upload_folder)
    os.makedirs(abs_upload_folder, exist_ok=True)
    
    # Save file with secure filename
    filename = secure_filename(file.filename)
    if not filename:
        filename = "uploaded_file.pdf"
    
    filepath = os.path.join(abs_upload_folder, filename)
    
    try:
        file.save(filepath)
        print(f"File saved to: {filepath}")
        print(f"File exists after save: {os.path.exists(filepath)}")
        return filepath, None
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        return None, (jsonify({"error": f"Failed to save file: {str(e)}"}), 500)

def extract_tables_from_pdf(pdf_path):
    """
    Extract all tables from all pages of a PDF.
    Returns a list of tables.
    """
    tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables.extend(page.extract_tables())
    return tables
