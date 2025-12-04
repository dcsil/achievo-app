from datetime import datetime, timedelta
from dateutil.parser import parse as date_parse
import uuid
import sys
import os
import random

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.utils.file_utils import extract_tables_from_pdf

user_id = "paul_paw_test"
assignment_id = None

# Fix: Use absolute path based on current file location
def get_upload_path(filename):
    """Get the absolute path for uploaded files"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up to backend directory, then to storage/uploads
    backend_dir = os.path.join(current_dir, '..', '..')
    upload_dir = os.path.join(backend_dir, 'app', 'storage', 'uploads')
    
    # Create directory if it doesn't exist
    os.makedirs(upload_dir, exist_ok=True)
    
    return os.path.join(upload_dir, filename)

def detect_term_from_pdf(pdf_path):
    """
    Legacy function kept for backward compatibility.
    Returns default term - actual term should be provided by user selection.
    """
    return "2025 Fall"  # Default fallback

def get_term_schedule(term_str: str):
    """
    Return schedule config (start/end dates, breaks, holidays) for a given term string.
    Supported: 'Fall 2025' and 'Winter 2026' terms.
    """
    # Clean the term string and extract meaningful parts
    clean_term = term_str.strip().lower()
    
    # Fall 2025 term: Sep–Dec 2025
    if 'fall' in clean_term and '2025' in clean_term:
        original_start_date = date_parse("2025-09-02")
        end_date = date_parse("2025-12-02")
        breaks = [
            # Fall Reading Week
            (date_parse("2025-10-27"), date_parse("2025-10-31")),
        ]
        holidays = [
            # Thanksgiving (Canada)
            date_parse("2025-10-13"),
        ]
    # Winter 2026 term: Jan–Apr 2026
    elif 'winter' in clean_term and '2026' in clean_term:
        original_start_date = date_parse("2026-01-06")
        end_date = date_parse("2026-04-10")
        breaks = [
            # Winter Reading Week (typical mid-Feb)
            (date_parse("2026-02-16"), date_parse("2026-02-20")),
        ]
        holidays = [
            # Family Day (Canada)
            date_parse("2026-02-16"),
            # Good Friday (Canada)
            date_parse("2026-04-03"),
        ]
    # Fallback based on term keyword
    elif 'fall' in clean_term:
        original_start_date = date_parse("2025-09-02")
        end_date = date_parse("2025-12-02")
        breaks = [
            (date_parse("2025-10-27"), date_parse("2025-10-31")),
        ]
        holidays = [
            date_parse("2025-10-13"),
        ]
    else:
        # Default to Winter 2026 schedule
        original_start_date = date_parse("2026-01-05")
        end_date = date_parse("2026-04-6")
        breaks = [
            (date_parse("2026-02-16"), date_parse("2026-02-20")),
        ]
        holidays = [
            date_parse("2026-02-16"),
            date_parse("2026-04-03"),
        ]

    return {
        "original_start_date": original_start_date,
        "end_date": end_date,
        "breaks": breaks,
        "holidays": holidays,
    }

# Remove automatic term detection at module level
# term = detect_term_from_pdf(pdf_path)  # Remove this
# Use default term that will be overridden by API calls
term = "2025 Fall"  # Default

schedule_config = get_term_schedule(term)
original_start_date = schedule_config["original_start_date"]
current_date = datetime.now().date()
start_date = max(original_start_date.date(), current_date)
start_date = datetime.combine(start_date, datetime.min.time())
end_date = schedule_config["end_date"]
breaks = schedule_config["breaks"]
holidays = schedule_config["holidays"]

def extract_timetable_courses(pdf_path, user_id, term):
    """
    Extract course information from timetable PDF.
    """
    # Verify file exists before processing
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    courses = {}
    date_imported_at = datetime.now().isoformat()
    
    colors = ['blue', 'red', 'yellow', 'green', 'purple', 'pink', 'indigo', 'orange']

    tables = extract_tables_from_pdf(pdf_path)

    for table in tables:
        header = table[0]
        for row in table[1:]:
            for i, cell in enumerate(row[1:], 1):
                if cell and cell.strip():
                    code_part, time_label = _parse_course_cell(cell)
                    if not code_part:
                        continue
                    course_code = code_part.split()[0]
                    meeting_day = header[i]  
                    
                    # Initialize course entry if not present
                    if course_code not in courses:
                        courses[course_code] = {
                            "course_id": str(uuid.uuid4()),
                            "user_id": user_id,
                            "course_name": course_code,
                            "course_code": course_code,
                            "canvas_course_id": "",
                            "date_imported_at": date_imported_at,
                            "term": term,
                            "color": random.choice(colors),
                            "meeting_days": [],
                            "meeting_times": [],
                            "meeting_sessions": []  # Keep for internal use
                        }
                    
                    session = {
                        "day": meeting_day,
                        "time": time_label
                    }
                    
                    session_exists = any(
                        s["day"] == meeting_day and s["time"] == time_label 
                        for s in courses[course_code]["meeting_sessions"]
                    )
                    
                    if not session_exists:
                        courses[course_code]["meeting_sessions"].append(session)
                        # Also add to frontend-expected arrays
                        if meeting_day not in courses[course_code]["meeting_days"]:
                            courses[course_code]["meeting_days"].append(meeting_day)
                        if time_label and time_label not in courses[course_code]["meeting_times"]:
                            courses[course_code]["meeting_times"].append(time_label)
    
    return list(courses.values())

def _parse_course_cell(cell):
    """
    Parse a cell to extract course code and time label.
    """
    parts = cell.split('\n')
    code_part = parts[0].strip() if parts else None
    time_label = None
    for x in parts:
        if "-" in x and ":" in x:
            time_label = x.strip()
            break
    return code_part, time_label

def parse_time_range(time_str):
    """
    Parse a time range string into start and end time objects.
    Handles 12-hour format without AM/PM like "9:00 - 12:00" or "6:00 - 8:00"
    Determines AM/PM based on logical sequence and typical class hours.
    """
    print(f"Parsing time string: '{time_str}'")  
    
    parts = time_str.split('-')
    if len(parts) != 2:
        raise ValueError(f"Invalid time format: {time_str}")
    
    start_str = parts[0].strip()
    end_str = parts[1].strip()
    
    print(f"Start: '{start_str}', End: '{end_str}'")  
    
    try:
        start_dt = datetime.strptime(start_str, "%H:%M")
        end_dt = datetime.strptime(end_str, "%H:%M")
        
        start_hour = start_dt.hour
        end_hour = end_dt.hour
        
        # Determine AM/PM based on the time sequence
        # If start time is 8-11 and end time is 12 or after, it's AM to PM
        # If both times are low (1-7), it's likely evening PM
        # If start time is 9+ and end time is lower, end time needs +12
        
        if start_hour >= 8 and end_hour == 12:
            # Morning class ending at noon (e.g., 9:00 AM - 12:00 PM)
            final_start_hour = start_hour
            final_end_hour = 12
        elif start_hour >= 8 and end_hour < start_hour:
            # Morning class ending in afternoon (e.g., 9:00 AM - 1:00 PM)
            final_start_hour = start_hour
            final_end_hour = end_hour + 12
        elif start_hour <= 7 and end_hour <= 11 and end_hour >= start_hour:
            # Evening class (e.g., 6:00 PM - 8:00 PM)
            final_start_hour = start_hour + 12
            final_end_hour = end_hour + 12
        else:
            # Default case - keep as is if times make sense
            final_start_hour = start_hour
            final_end_hour = end_hour
            
        start_time = datetime.strptime(f"{final_start_hour:02d}:{start_dt.minute:02d}", "%H:%M").time()
        end_time = datetime.strptime(f"{final_end_hour:02d}:{end_dt.minute:02d}", "%H:%M").time()
            
    except ValueError as e:
        print(f"Error parsing times: {e}")
        raise ValueError(f"Could not parse time range: {time_str}")
    
    print(f"Parsed times - Start: {start_time}, End: {end_time}")  
    
    return start_time, end_time

def generate_tasks_for_courses(courses, user_id, assignment_id, start_date, end_date, breaks, holidays):
    """
    Generate scheduled class session tasks for each course.
    """
    def get_weekday_number(day_name):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days.index(day_name)

    def daterange(start_date, end_date):
        for n in range(int((end_date - start_date).days) + 1):
            yield start_date + timedelta(n)

    def is_in_breaks(date, breaks):
        for start, end in breaks:
            if start <= date <= end:
                return True
        return False

    def is_in_holidays(date, holidays):
        return date in holidays

    tasks = []
    for course in courses:
        for session in course["meeting_sessions"]:
            day = session["day"]
            time_str = session["time"]
            
            if not time_str:
                continue 
                
            weekday_num = get_weekday_number(day)
            try:
                start_time, end_time = parse_time_range(time_str)
            except Exception:
                continue  
                
            for current_date in daterange(start_date, end_date):
                if (
                    current_date.weekday() == weekday_num
                    and not is_in_breaks(current_date, breaks)
                    and not is_in_holidays(current_date, holidays)
                ):
                    start_dt = datetime.combine(current_date, start_time)
                    end_dt = datetime.combine(current_date, end_time)
                    num_hours = (end_dt - start_dt).total_seconds() / 3600
                    reward_points = int(round(num_hours * 10))
                    task = {
                        "task_id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "assignment_id": assignment_id,
                        "course_id": course["course_id"],
                        "description": f"{course['course_name']} class session",
                        "type": "class",
                        "scheduled_start_at": start_dt.isoformat(),
                        "scheduled_end_at": end_dt.isoformat(),
                        "is_completed": False,
                        "completion_date_at": None,
                        "reward_points": reward_points,
                    }
                    tasks.append(task)
    return tasks

# Export functions and variables for use in other modules
__all__ = [
    'detect_term_from_pdf',
    'get_term_schedule', 
    'extract_timetable_courses',
    'parse_time_range',
    'generate_tasks_for_courses',
    'term',
    'user_id',
    'assignment_id',
    'start_date',
    'end_date',
    'breaks',
    'holidays'
]

# Example usage
if __name__ == "__main__":
    # Use absolute path for testing
    test_pdf_path = get_upload_path("timetable.pdf")
    
    # Check if file exists before processing
    if not os.path.exists(test_pdf_path):
        print(f"Test file not found at: {test_pdf_path}")
        print("Please ensure the PDF file exists in the uploads directory.")
        sys.exit(1)
    
    # Detect term from PDF and get appropriate schedule
    detected_term = detect_term_from_pdf(test_pdf_path)
    print(f"Detected term: {detected_term}")
    
    schedule_config = get_term_schedule(detected_term)
    original_start_date = schedule_config["original_start_date"]
    current_date = datetime.now().date()
    start_date = max(original_start_date.date(), current_date)
    start_date = datetime.combine(start_date, datetime.min.time())
    end_date = schedule_config["end_date"]
    breaks = schedule_config["breaks"]
    holidays = schedule_config["holidays"]
    
    course_list = extract_timetable_courses(test_pdf_path, user_id, detected_term)
    tasks = generate_tasks_for_courses(course_list, user_id, assignment_id, start_date, end_date, breaks, holidays)
    num = 0
    for t in tasks:
        if t["course_id"] == "PHL277H1":
            print(t)
            num+=1
    print(f"Total PHLtasks generated: {num}" )