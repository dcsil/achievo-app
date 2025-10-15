
import requests
import os
from dotenv import load_dotenv

load_dotenv()
canvas_token = os.getenv("CANVAS_TOKEN")
canvas_domain = "q.utoronto.ca"

def get_courses():
    """Fetch all courses for the user associated with the token."""
    url = f"https://{canvas_domain}/api/v1/courses"
    headers = {"Authorization": f"Bearer {canvas_token}"}
    params = {"per_page": 100}
    all_courses = []
    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            print("Error:", response.text)
            break
        all_courses.extend(response.json())
        # Look for next page in "Link" header
        links = response.headers.get("Link", "")
        next_url = None
        for link in links.split(","):
            if 'rel="next"' in link:
                next_url = link[link.find("<")+1:link.find(">")]
                break
        url = next_url  # None if no "next" found
        params = None  # Only needed for first request
    return all_courses

def get_assignments(course_id):
    """Fetch all assignments for a given course."""
    url = f"https://{canvas_domain}/api/v1/courses/{course_id}/assignments"
    headers = {"Authorization": f"Bearer {canvas_token}"}
    params = [
        ("include[]", "all_dates"),
        ("include[]", "submission")
    ]
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print("Error:", response.text)
        return None

# Example usage:
if __name__ == "__main__":
    # Get all courses
    courses = get_courses()
    print(f"Total courses found: {len(courses)}")
    for course in courses:
        print(course.get("name"), course.get("id"))

    # Get assignments for a specific course (replace with a real course_id)
    if courses:
        first_course_id = courses[0].get("id")
        assignments = get_assignments(first_course_id)
        if assignments:
            for assignment in assignments:
                print(f"Assignment: {assignment['name']}")
                print(f"  Due at: {assignment.get('due_at')}")
                # Print any per-group or override due dates
                if "all_dates" in assignment and assignment["all_dates"]:
                    for date in assignment["all_dates"]:
                        print(f"    Override due at: {date['due_at']} (for: {date['title']})")
                # Print submission status
                submission = assignment.get("submission")
                if submission:
                    print(f"  Submission status: {submission.get('workflow_state')}")
                    print(f"  Submitted at: {submission.get('submitted_at')}")
                else:
                    print("  Submission status: No submission information")