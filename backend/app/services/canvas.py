import requests
import os
from dotenv import load_dotenv

load_dotenv()
canvas_token = os.getenv("CANVAS_TOKEN")

course_id = 404197  # Replace with your course ID

# canvas_domain = "q.utoronto.ca"
# url = f"https://{canvas_domain}/api/v1/courses"
# headers = {"Authorization": f"Bearer {canvas_token}"}
# params = {"per_page": 100}

# all_courses = []

# while url:
#     response = requests.get(url, headers=headers, params=params)
#     if response.status_code != 200:
#         print("Error:", response.text)
#         break
#     all_courses.extend(response.json())

#     # Look for next page in "Link" header
#     links = response.headers.get("Link", "")
#     next_url = None
#     for link in links.split(","):
#         if 'rel="next"' in link:
#             next_url = link[link.find("<")+1:link.find(">")]
#             break
#     url = next_url  # None if no "next" found

# print(f"Total courses found: {len(all_courses)}")
# for course in all_courses:
#     print(course["name"], course["id"])

# url = f"https://{canvas_domain}/api/v1/courses/{course_id}"
# headers = {"Authorization": f"Bearer {canvas_token}"}

# response = requests.get(url, headers=headers)
# if response.status_code == 200:
#     course = response.json()
#     print("Course Name:", course.get("name"))
#     print("Start Date:", course.get("start_at"))
#     print("End Date:", course.get("end_at"))
# else:
#     print("Error:", response.text)

url = f"https://q.utoronto.ca/api/v1/courses/{course_id}/assignments"
headers = {
    "Authorization": f"Bearer {canvas_token}"
}

params = [
    ("include[]", "all_dates"),
    ("include[]", "submission")
]

response = requests.get(url, headers=headers, params=params)
print(f"Status code: {response.status_code}")

if response.status_code == 200:
    assignments = response.json()
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
else:
    print("Error:", response.text)