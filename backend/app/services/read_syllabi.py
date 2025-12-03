import pathlib
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import json
import uuid
from datetime import datetime

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY or API_KEY == "GEMINI_API_KEY":
    raise ValueError("GEMINI_API_KEY not provided. Please set it in your .env file.")

client = genai.Client(api_key=API_KEY)

pdf_path = "backend/app/storage/uploads/dummy.pdf"
busy = [
    {"start": "2025-11-13T09:00:00", "end": "2025-11-13T14:00:00"},
    {"start": "2025-11-17T15:00:00", "end": "2025-11-17T17:00:00"}
]

# Output schema for tasks and assignments with micro-task compatible timing
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
                    "scheduled_start_at": {"type": "string", "nullable": True},
                    "scheduled_end_at": {"type": "string", "nullable": True},
                    "completion_date_at": {"type": "string", "nullable": True}
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

def add_ids_to_extracted_data(extracted_data: dict, user_id: str = "paul_paw_test", course_id: str = None) -> dict:
    """Add unique IDs to assignments and tasks extracted from PDF."""
    
    assignments_with_ids = []
    for assignment in extracted_data.get("assignments", []):
        assignment_with_id = {
            "assignment_id": str(uuid.uuid4()),
            "user_id": user_id,
            "course_id": course_id,  
            "title": assignment.get("title"),
            "due_date": assignment.get("due_date"),
            "completion_points": assignment.get("weight", 0) * 10 if assignment.get("weight") else 10,  
            "is_complete": False,
            **assignment  
        }
        assignments_with_ids.append(assignment_with_id)
    
    tasks_with_ids = []
    for task in extracted_data.get("tasks", []):
        task_with_id = {
            "task_id": str(uuid.uuid4()),
            "user_id": user_id,
            "description": task.get("title"),
            "type": "exam",  
            "assignment_id": None,  
            "course_id": course_id,  
            "scheduled_start_at": task.get("scheduled_start_at"),
            "scheduled_end_at": task.get("scheduled_end_at"),
            "is_completed": False,
            "reward_points": task.get("weight", 0) if task.get("weight") else 10,  
            **task 
        }
        tasks_with_ids.append(task_with_id)
    
    return {
        "assignments": assignments_with_ids,
        "tasks": tasks_with_ids
    }

def generate_assignment_microtasks(
    assignments: list,
    busy_intervals: list,
    default_micro_task_count: int = 3
) -> dict:
    """
    assignments: list of {"title": ..., "due_date": ..., "weight": ...}
    busy_intervals: list of {"start": ..., "end": ...}
    Returns: dict with "assignments" array, each with nested "micro_tasks"
    """
    assignments_with_micro = []

    for idx, assignment in enumerate(assignments):
        prev_due_date = assignments[idx-1]['due_date'] if idx > 0 else datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
        curr_due_date = assignment['due_date']

        prompt = f"""
You are a productivity assistant. For this assignment:

- Title: {assignment['title']}
- Due date: {curr_due_date}
- Assignment window: from "{prev_due_date}" to "{curr_due_date}"
- The user is unavailable at: {json.dumps(busy_intervals, indent=2)}

Propose {default_micro_task_count} micro-tasks to help complete this assignment, following this format:
[
  {{
    "title": "",
    "scheduled_start_at": "YYYY-MM-DDTHH:MM:SS",
    "scheduled_end_at": "YYYY-MM-DDTHH:MM:SS",
    "completion_date_at": null,
    "weight": null
  }}
  // ...repeat for each micro-task
]
Each assignment must have at least one task for submission before the due.
All micro-tasks must fit between "{prev_due_date}" and "{curr_due_date}", never overlap any busy interval, and time fields must be provided as 'YYYY-MM-DDTHH:MM:SS'. If a task lands in a busy interval, move it to the closest available slot. Return only the JSON array, no extra text.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        micro_tasks = json.loads(response.text)
        assignment_with_micro = {**assignment, "micro_tasks": micro_tasks}
        assignments_with_micro.append(assignment_with_micro)

    return {"assignments": assignments_with_micro}

def generate_assignment_microtasks_with_ids(
    assignments: list,
    busy_intervals: list,
    default_micro_task_count: int = 3,
    user_id: str = "paul_paw_test"
) -> dict:
    """
    Enhanced version that generates micro-tasks with proper IDs for database insertion.
    assignments: list of assignment dicts (should have assignment_id)
    busy_intervals: list of {"start": ..., "end": ...}
    Returns: dict with "assignments" array, each with nested "micro_tasks" that have proper IDs
    """
    assignments_with_micro = []

    for idx, assignment in enumerate(assignments):
        assignment_id = assignment.get("assignment_id")
        if not assignment_id:
            assignment_id = str(uuid.uuid4())
            assignment["assignment_id"] = assignment_id
        
        prev_due_date = assignments[idx-1]['due_date'] if idx > 0 else datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
        curr_due_date = assignment['due_date']

        prompt = f"""
You are a productivity assistant. For this assignment:

- Title: {assignment['title']}
- Due date: {curr_due_date}
- Assignment window: from "{prev_due_date}" to "{curr_due_date}"
- The user is unavailable at: {json.dumps(busy_intervals, indent=2)}

Propose {default_micro_task_count} micro-tasks to help complete this assignment, following this format:
[
  {{
    "title": "",
    "scheduled_start_at": "YYYY-MM-DDTHH:MM:SS",
    "scheduled_end_at": "YYYY-MM-DDTHH:MM:SS",
    "completion_date_at": null,
    "weight": null
  }}
  // ...repeat for each micro-task
]
Each assignment must have at least one task for submission before the due.
All micro-tasks must fit between "{prev_due_date}" and "{curr_due_date}", never overlap any busy interval, and time fields must be provided as 'YYYY-MM-DDTHH:MM:SS'. If a task lands in a busy interval, move it to the closest available slot. Return only the JSON array, no extra text.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        micro_tasks_raw = json.loads(response.text)
        
        micro_tasks_with_ids = []
        for micro_task in micro_tasks_raw:
            micro_task_with_id = {
                "task_id": str(uuid.uuid4()),
                "user_id": user_id,
                "description": micro_task.get("title"),
                "type": "assignment",
                "assignment_id": assignment_id,
                "course_id": assignment.get("course_id"),  
                "scheduled_start_at": micro_task.get("scheduled_start_at"),
                "scheduled_end_at": micro_task.get("scheduled_end_at"),
                "is_completed": False,
                "reward_points": 10,  
                **micro_task  
            }
            micro_tasks_with_ids.append(micro_task_with_id)
        
        assignment_with_micro = {**assignment, "micro_tasks": micro_tasks_with_ids}
        assignments_with_micro.append(assignment_with_micro)

    return {"assignments": assignments_with_micro}

if __name__ == "__main__":

    output = extract_tasks_assignments_from_pdf(pdf_path)
    print(json.dumps(output, indent=2))
    base_assignments = output["assignments"]

    result = generate_assignment_microtasks(base_assignments, busy, default_micro_task_count=3)
    print(json.dumps(result, indent=2))

    result = generate_assignment_microtasks(base_assignments, busy, default_micro_task_count=3)
    print(json.dumps(result, indent=2))
