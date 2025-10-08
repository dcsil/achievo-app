import pathlib
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv("backend/app/.env")
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

def extract_tasks_from_pdf(pdf_path: str) -> str:
    filepath = pathlib.Path(pdf_path)

    prompt = """You are given a course syllabus in PDF text.
    Extract all assignments, labs, and projects with deadlines.
    Return strictly in this JSON format:

    {
      "assignments": [{"title": "...", "due_date": "YYYY-MM-DD", "weight": "PERCENT"}],
      "labs": [{"title": "...", "due_date": "YYYY-MM-DD"}],
      "projects": [{"title": "...", "due_date": "YYYY-MM-DD"}]
    }"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(
                data=filepath.read_bytes(),
                mime_type="application/pdf",
            ),
            prompt
        ]
    )
    return response.text

def extract_events_from_pdf(pdf_path: str) -> str:
    filepath = pathlib.Path(pdf_path)

    prompt = """You are given a course syllabus in PDF text.
    Extract all exam-related events: midterm(s), make-up midterm(s), final exam,
    and quizzes with dates if mentioned.
    Return strictly in this JSON format:

    {
      "midterms": ["YYYY-MM-DD"],
      "final_exam": "YYYY-MM-DD" or null,
      "quizzes": [{"title": "...", "date": "YYYY-MM-DD"}]
    }"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(
                data=filepath.read_bytes(),
                mime_type="application/pdf",
            ),
            prompt
        ]
    )
    return response.text