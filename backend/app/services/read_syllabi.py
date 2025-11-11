import pathlib
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import json

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY or API_KEY == "GEMINI_API_KEY":
    raise ValueError("GEMINI_API_KEY not provided. Please set it in your .env file.")

client = genai.Client(api_key=API_KEY)

# Output schema for tasks and assignments with rich task timing
output_schema = {
    "type": "object",
    "properties": {
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "weight": {"type": "integer", "nullable": True},
                    "scheduled_start_at": {"type": "string", "nullable": True},    # "YYYY-MM-DDTHH:MM:SS"
                    "scheduled_end_at": {"type": "string", "nullable": True},      # "YYYY-MM-DDTHH:MM:SS"
                    "completion_date_at": {"type": "string", "nullable": True}     # "YYYY-MM-DDTHH:MM:SS"
                },
                "required": ["title", "weight", "scheduled_start_at", "scheduled_end_at", "completion_date_at"]
            }
        },
        "assignments": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "due_date": {"type": "string"},
                    "weight": {"type": "integer", "nullable": True}
                },
                "required": ["title", "due_date", "weight"]
            }
        }
    },
    "required": ["tasks", "assignments"]
}

def extract_tasks_assignments_from_pdf(pdf_path: str) -> dict:
    filepath = pathlib.Path(pdf_path)

    prompt = """
You are given a course syllabus in PDF text.

Classify all deadline-related items into two categories:
- "tasks": These include tests, quizzes, and exam-related events (e.g., "Midterm 1", "Final Exam", "Quiz 2").
- "assignments": All other items (e.g., assignments, labs, projects, reports, etc.).

For each task, extract:
- "title": Name of the test/quiz/exam.
- "weight": The percentage weight as an integer (e.g., 8 for 8%). If not provided, use null.
- "scheduled_start_at": Start time as string in YYYY-MM-DDTHH:MM:SS format. Null if not specified.
- "scheduled_end_at": End time as string in YYYY-MM-DDTHH:MM:SS format. Null if not specified.
- "completion_date_at": Date/time it was marked completed (YYYY-MM-DDTHH:MM:SS) or null.

For each assignment, extract:
- "title": Name of the item.
- "due_date": Due date/time in exact format YYYY-MM-DDTHH:MM:SS (24h, leading zeros).
- "weight": The percentage weight as an integer. Null if missing.

Instructions:
- Classify each deadline.
- For tests from 2-5, set scheduled_start_at to 2pm, scheduled_end_at to 5pm.
- Time formats must always be YYYY-MM-DDTHH:MM:SS.
- If a value is missing, use null.
- Output strictly as JSON object matching the schema: "tasks" and "assignments".
- Do not add explanations or extra text.

Output Format:
{
  "tasks": [
    {
      "title": "",
      "weight": 8,
      "scheduled_start_at": "YYYY-MM-DDTHH:MM:SS",
      "scheduled_end_at": "YYYY-MM-DDTHH:MM:SS",
      "completion_date_at": null
    }
    // ...repeat
  ],
  "assignments": [
    {
      "title": "",
      "due_date": "YYYY-MM-DDTHH:MM:SS",
      "weight": 8
    }
    // ...repeat
  ]
}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(
                data=filepath.read_bytes(),
                mime_type="application/pdf",
            ),
            prompt
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=output_schema
        )
    )

    if isinstance(response.text, str):
        return json.loads(response.text)
    else:
        return response.text

if __name__ == "__main__":
    pdf_path = "backend/app/storage/uploads/PHL277.pdf"
    result = extract_tasks_assignments_from_pdf(pdf_path)
    print(json.dumps(result, indent=2))
