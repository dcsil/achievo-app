
## Backend Setup

### 1. Install dependencies

```
cd src/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables

Copy .env.example → .env and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the backend

```
cd src/backend
python -m app.main
```

This starts a Flask server on http://127.0.0.1:5000.


### 4. Test locally

	•	Place a sample syllabus.pdf in src/backend/app/storage/uploads/.
	•	Use curl or Postman:

```
curl -X POST http://127.0.0.1:5000/extract/events \
  -F "file=@backend/app/storage/uploads/dummy.pdf"
```

You should see Gemini return extracted tasks/events in Json format.

### 5. Run unit tests

Unit tests are written using [pytest](https://docs.pytest.org/). To run all backend unit tests:

1. Install test dependencies (if not already, including coverage):

```
pip install pytest pytest-cov flask werkzeug
```

2. From the backend directory, run (with coverage):

```
pytest --cov=app app/utils/test_file_utils.py
```

Or, from the project root (with coverage):

```
pytest --cov=backend/app backend/app/utils/test_file_utils.py
```

This will show a coverage report in the terminal. You can add more tests in the `app/utils/` directory as needed.
All tests should pass. You can add more tests in the `app/utils/` directory as needed.


## Gamification API Reference

This section documents the gamification-related endpoints added for the frontend. All endpoints are served by the Flask app on http://127.0.0.1:5000 unless configured otherwise.

Notes
- All responses are JSON. Errors follow the shape: { "error": "message" } with an appropriate HTTP status code.
- Example requests below use curl with explicit JSON bodies to avoid quoting issues.

### 1) List Blind Box Series
- Method/Path: GET /db/blind-box-series
- Purpose: Return all available blind box series.

Example
```
curl -X GET http://127.0.0.1:5000/db/blind-box-series
```

Sample response
```json
[
	{ "series_id": "S1", "name": "Study Buddies", "description": "Cute helpers", "cost_points": 50, "release_date": "2025-11-01" }
]
```

### 2) Affordable Series for a User
- Method/Path: GET /db/blind-box-series/affordable?user_id=USER
- Purpose: Return series the user can afford given their current points and echo user_points.

Example
```
curl -X GET "http://127.0.0.1:5000/db/blind-box-series/affordable?user_id=paul_paw_test"
```

Sample response
```json
{
	"user_id": "paul_paw_test",
	"user_points": 500,
	"affordable_series": [
		{ "series_id": "S1", "name": "Study Buddies", "description": "Cute helpers", "cost_points": 50, "release_date": "2025-11-01" }
	]
}
```

### 3) Purchase Preview
- Method/Path: GET /db/blind-boxes/preview?user_id=USER
- Purpose: Convenience preview with current user_points and affordable_series.

Example
```
curl -X GET "http://127.0.0.1:5000/db/blind-boxes/preview?user_id=paul_paw_test"
```

Sample response
```json
{
	"user_id": "paul_paw_test",
	"user_points": 500,
	"affordable_series": [
		{ "series_id": "S1", "name": "Study Buddies", "description": "Cute helpers", "cost_points": 50, "release_date": "2025-11-01" }
	]
}
```

### 4) User Inventory (Figures)
- Method/Path: GET /db/users/{user_id}/figures
- Query params: limit (int, default 50), offset (int, default 0), rarity (string), series_id (string)
- Purpose: Paginated, filterable list of awarded figures for the user.

Example
```
curl -X GET "http://127.0.0.1:5000/db/users/paul_paw_test/figures?limit=10&offset=0&rarity=rare"
```

Sample response
```json
{
	"total": 3,
	"limit": 10,
	"offset": 0,
	"results": [
		{
			"purchase_id": "...",
			"user_id": "paul_paw_test",
			"series_id": "S1",
			"purchased_at": "2025-11-12T12:00:00",
			"opened_at": "2025-11-12T12:00:00",
			"awarded_figure_id": "F3",
			"figure_name": "Phoenix Coach",
			"figure_rarity": "rare",
			"series_name": "Study Buddies"
		}
	]
}
```

### 5) Assignment Progress (per user, optional course filter)
- Method/Path: GET /db/assignments/progress?user_id=USER[&course_id=COURSE]
- Purpose: Return assignments augmented with task_count, completed_task_count, and percent_complete for that user.

Example
```
curl -X GET "http://127.0.0.1:5000/db/assignments/progress?user_id=paul_paw_test&course_id=COURSE123"
```

Sample response
```json
[
	{
		"assignment_id": "A1",
		"course_id": "COURSE123",
		"title": "Essay",
		"due_date": "2025-11-20",
		"completion_points": 200,
		"is_complete": false,
		"task_count": 2,
		"completed_task_count": 1,
		"percent_complete": 50
	}
]
```

### 6) Course Progress Roll-up
- Method/Path: GET /db/courses/progress?user_id=USER
- Purpose: Per-course roll-up of assignment and task completion with overall_percent.

Example
```
curl -X GET "http://127.0.0.1:5000/db/courses/progress?user_id=paul_paw_test"
```

Sample response
```json
[
	{
		"course_id": "COURSE123",
		"course_name": "Intro to Testing",
		"color": "blue",
		"assignment_count": 1,
		"completed_assignment_count": 0,
		"task_count": 2,
		"completed_task_count": 1,
		"overall_percent": 50
	}
]
```

### 7) User Level Progress
- Method/Path: GET /db/users/{user_id}/progress
- Purpose: Return current level, next level points, and progress percent calculated from total_points.

Example
```
curl -X GET http://127.0.0.1:5000/db/users/paul_paw_test/progress
```

Sample response
```json
{
	"user_id": "paul_paw_test",
	"total_points": 500,
	"current_level": 3,
	"next_level": 4,
	"next_level_points": 900,
	"progress_percent": 0,
	"points_into_level": 0,
	"points_required_for_next": 400
}
```

### 8) Dashboard (Batch)
- Method/Path: GET /db/dashboard?user_id=USER
- Purpose: Single call returning user, tasks (today/upcoming), per-course progress, and level progress.

Example
```
curl -X GET "http://127.0.0.1:5000/db/dashboard?user_id=paul_paw_test"
```

Sample response (abridged)
```json
{
	"user": { "user_id": "paul_paw_test", "canvas_username": "Paul", "total_points": 500, "current_level": 3 },
	"tasks": {
		"today": [ { "task_id": "T1", "description": "Outline essay", "scheduled_end_at": "2025-11-12T00:00:00Z" } ],
		"upcoming": [ { "task_id": "T2", "description": "Write first draft", "scheduled_end_at": "2025-11-13T00:00:00Z" } ]
	},
	"courses": [ { "course_id": "COURSE123", "overall_percent": 50 } ],
	"level_progress": { "current_level": 3, "next_level": 4, "progress_percent": 0 }
}
```

### Related (existing) Blind Box Purchase
- Method/Path: POST /db/blind-boxes/purchase
- Body: { "user_id": "...", "series_id": "..." } (omit series_id to buy a random affordable series)
- Purpose: Deduct points, award a random figure from the series, and record purchase.

Example
```
curl -X POST http://127.0.0.1:5000/db/blind-boxes/purchase \
	-H "Content-Type: application/json" \
	-d '{"user_id":"paul_paw_test","series_id":"S1"}'
```

Sample response
```json
{
	"status": "purchased",
	"purchase_id": "...",
	"series_id": "S1",
	"series_name": "Study Buddies",
	"cost_points": 50,
	"awarded_figure": { "figure_id": "F1", "name": "Cat Mentor", "rarity": "common" },
	"remaining_points": 450
}
```
