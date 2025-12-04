# Achievo Backend

A Flask-based REST API backend for the Achievo student productivity and gamification app. Provides endpoints for user management, task/assignment tracking, course management, and a blind box rewards system.

## Tech Stack

- **Framework**: Flask with Flask-CORS
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Google Gemini API for PDF extraction
- **Testing**: pytest with coverage reporting
- **PDF Processing**: pdfplumber for table extraction
- **External APIs**: Canvas LMS integration

## Prerequisites

- Python 3.8+
- Supabase URL & key
- Google Gemini API key
- Canvas LMS API token (optional, for Canvas integration)

## Setup

### 0. (Optional) Create & Run Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 1. Install Dependencies

From the backend directory:

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

```bash
# Google Gemini API (for PDF syllabus extraction)
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
```

**Note**: The Gemini API is used for intelligent extraction of tasks and assignments from course syllabi PDFs.

### 3. Database Setup

The application uses Supabase as the database. See `database/README.md` for detailed schema setup instructions.

Tables include:
- `users` - User profiles with points and levels
- `courses` - Course information
- `assignments` - Course assignments with due dates
- `tasks` - Individual tasks (can be standalone or linked to assignments)
- `blind_box_series` - Collectible blind box series
- `blind_box_figures` - Individual collectible figures
- `user_blind_boxes` - User's purchased and opened blind boxes

### 4. Run the Backend

From the backend directory:

```bash
cd app
python3 main.py
```

The Flask server will start at **http://127.0.0.1:5000**

### 5. Testing

The project uses pytest with comprehensive test coverage.

#### Run All Tests

From the backend directory:

```bash
pytest
```

#### Run Tests with Coverage

```bash
pytest --cov=app --cov-report=html
```

#### Run Specific Test Files

```bash
# Test file utilities
pytest app/utils/test_file_utils.py

# Test tasks API
pytest app/services/test_tasks_api.py

# Test all API endpoints
pytest app/services/test_*.py
```

#### Test Configuration

- **pytest.ini**: Configures test discovery and coverage options
- **conftest.py**: Shared fixtures for Flask app and test client
- Test files follow the pattern `test_*.py` in `app/services/` and `app/utils/`

All tests should pass before committing changes.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # Flask application with all API routes
│   ├── services/            # Business logic and API tests
│   │   ├── canvas.py        # Canvas LMS API integration
│   │   ├── read_syllabi.py  # Gemini-based syllabus PDF extraction
│   │   ├── read_timetable.py # Timetable PDF processing
│   │   └── test_*.py        # API endpoint tests
│   ├── utils/               # Utility functions
│   │   ├── file_utils.py    # File upload and PDF processing
│   │   └── test_file_utils.py # Unit tests for file utilities
│   └── storage/uploads/     # Uploaded file storage for dummy data
├── database/                # Database layer
│   ├── db_client.py         # Supabase client factory
│   ├── *_repository.py      # Data access objects (DAOs), one for each table
│   ├── supabase_schema.sql  # Database schema
│   └── README.md            # Database-specific setup guide
├── conftest.py              # Pytest shared fixtures
├── pytest.ini               # Pytest configuration
├── requirements.txt         # Python dependencies
├── README.md                # Overall backend setup guide
└── .env                     # Environment variables (not in git)
```

## Key Features

### 1. Task & Assignment Management
- Create, update, delete tasks and assignments
- Link tasks to assignments for micro-task breakdown
- Track completion status and due dates
- Support for various task types (study, assignment, reading, exercise, etc.)

### 2. Course Management
- Import courses from Canvas LMS
- Extract courses from timetable PDFs
- Track course progress based on completed assignments/tasks
- Color-coded course organization

### 3. Gamification System
- **Points & Levels**: Users earn points by completing tasks/assignments
- **Blind Box Rewards**: Purchase collectible figures with earned points
- **Rarity System**: Figures have different rarity levels (common, rare, epic, legendary)
- **Progress Tracking**: Visual progress indicators for courses and overall level

### 4. PDF Processing
- **Timetable Extraction**: Automatically parse timetable PDFs to create courses and recurring class tasks
- **Syllabus Extraction** (commented): AI-powered extraction of assignments from syllabi using Gemini

### 5. Canvas Integration
- Fetch courses and assignments from Canvas LMS
- Sync assignment due dates and details

## API Reference

All endpoints are served at **http://127.0.0.1:5000** by default.

### Response Format
- **Success**: JSON data with appropriate 2xx status code
- **Error**: `{"error": "message"}` with appropriate error status code

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account.

**Password Requirements:**
- At least 8 characters long
- Contains at least one uppercase letter
- Contains at least one lowercase letter
- Contains at least one number
- Contains at least one special character (!@#$%^&*()_+-=[]{};':"\|,.<>/?)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "display_name": "User Name"
}
```

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"newuser@example.com","password":"SecurePass123!","display_name":"New User"}'
```

#### POST `/auth/login`
Authenticate user and return user data.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"newuser@example.com","password":"SecurePass123!"}'
```

### User Endpoints

#### GET `/db/users`
List all users (admin/testing purposes).

**Example:**
```bash
curl http://127.0.0.1:5000/db/users
```

#### POST `/db/users`
Create a new user.

**Request Body:**
```json
{
  "user_id": "unique_id",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "canvas_username": "canvas_user",
  "canvas_domain": "example.instructure.com",
  "canvas_api_key": "optional_api_key",
  "profile_picture": "optional_url",
  "total_points": 0,
  "current_level": 0
}
```

**Note:** `user_id`, `email`, and `password` are required fields.

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/users \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test_user","email":"test@example.com","password":"SecurePass123!","canvas_username":"test_user","total_points":0,"current_level":0}'
```

#### PUT `/db/users/<user_id>`
Update user information (points, level, etc.).

**Example:**
```bash
curl -X PUT http://127.0.0.1:5000/db/users/test_user \
  -H 'Content-Type: application/json' \
  -d '{"total_points":150,"current_level":2}'
```

#### DELETE `/db/users/<user_id>`
Delete a user.

**Example:**
```bash
curl -X DELETE http://127.0.0.1:5000/db/users/test_user
```

#### GET `/db/users/<user_id>/figures`
Get user's collected blind box figures with pagination and filters.

**Query Parameters:**
- `limit` (int, default: 50) - Number of results per page
- `offset` (int, default: 0) - Pagination offset
- `rarity` (string, optional) - Filter by rarity
- `series_id` (string, optional) - Filter by series

**Example:**
```bash
curl "http://127.0.0.1:5000/db/users/paul_paw_test/figures?limit=10&rarity=rare"
```

#### GET `/db/users/<user_id>/progress`
Get user's level progression information.

**Response:**
```json
{
  "user_id": "paul_paw_test",
  "total_points": 500,
  "current_level": 3,
  "next_level": 4,
  "next_level_points": 900,
  "progress_percent": 55,
  "points_into_level": 220,
  "points_required_for_next": 400
}
```

### Task Endpoints

#### GET `/db/tasks`
Get tasks for a user with optional filters.

**Query Parameters (all optional except user_id):**
- `user_id` (required) - User ID
- `assignment_id` - Filter by assignment
- `course_id` - Filter by course
- `is_completed` (bool) - Filter by completion status

**Example:**
```bash
# Get all tasks for a user
curl "http://127.0.0.1:5000/db/tasks?user_id=test_user"

# Get incomplete tasks for a specific course
curl "http://127.0.0.1:5000/db/tasks?user_id=test_user&course_id=CSC301&is_completed=false"
```

#### GET `/db/tasks/combined`
Get tasks combined with assignment details and completion metadata.

**Query Parameters:**
- `user_id` (required)
- `is_completed` (bool, optional)

**Example:**
```bash
curl "http://127.0.0.1:5000/db/tasks/combined?user_id=test_user&is_completed=false"
```

#### POST `/db/tasks`
Create a new task.

**Request Body:**
```json
{
  "task_id": "unique_task_id",
  "user_id": "user_id",
  "description": "Complete reading chapter 5",
  "type": "reading",
  "scheduled_start_at": "2025-12-05T14:00:00Z",
  "scheduled_end_at": "2025-12-05T16:00:00Z",
  "course_id": "COURSE123",
  "assignment_id": "ASSIGN456",
  "is_completed": false,
  "reward_points": 10,
  "is_last_task": false
}
```

**Note:** `task_id`, `user_id`, `description`, and `type` are required fields.

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/tasks \
  -H 'Content-Type: application/json' \
  -d '{"task_id":"TASK123","user_id":"test_user","description":"Complete project proposal","type":"assignment","assignment_id":"A1","course_id":"CSC301","scheduled_end_at":"2025-12-10T23:59:00Z"}'
```

#### PUT `/db/tasks/<task_id>`
Update a task.

**Example:**
```bash
curl -X PUT http://127.0.0.1:5000/db/tasks/TASK123 \
  -H 'Content-Type: application/json' \
  -d '{"description":"Updated task description","is_completed":true}'
```

#### POST `/db/tasks/<task_id>/complete`
Mark a task as complete and award points.

**Request Body:**
```json
{
  "user_id": "user_id"
}
```

**Response:**
```json
{
  "status": "completed",
  "points_earned": 10,
  "new_total_points": 510,
  "level_up": false
}
```

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/tasks/TASK123/complete \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test_user"}'
```

#### DELETE `/db/tasks/<task_id>`
Delete a task.

**Example:**
```bash
curl -X DELETE http://127.0.0.1:5000/db/tasks/TASK123
```

### Assignment Endpoints

#### GET `/db/assignments`
Get assignments with optional course filter.

**Query Parameters:**
- `course_id` (optional)

**Example:**
```bash
# Get all assignments
curl http://127.0.0.1:5000/db/assignments

# Get assignments for a specific course
curl "http://127.0.0.1:5000/db/assignments?course_id=CSC301"
```

#### GET `/db/assignments/<assignment_id>`
Get a specific assignment by ID.

**Example:**
```bash
curl http://127.0.0.1:5000/db/assignments/A1
```

#### POST `/db/assignments`
Create a new assignment.

**Request Body:**
```json
{
  "assignment_id": "ASSIGN123",
  "course_id": "COURSE456",
  "title": "Final Essay",
  "due_date": "2025-12-15T23:59:00Z",
  "completion_points": 200,
  "weight": 30
}
```

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/assignments \
  -H 'Content-Type: application/json' \
  -d '{"assignment_id":"A1","course_id":"CSC301","title":"Final Project","due_date":"2025-12-15T23:59:00Z","completion_points":200}'
```

#### PUT `/db/assignments/<assignment_id>`
Update an assignment.

**Example:**
```bash
curl -X PUT http://127.0.0.1:5000/db/assignments/A1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Final Project - Updated","is_complete":true}'
```

#### DELETE `/db/assignments/<assignment_id>`
Delete an assignment.

**Example:**
```bash
curl -X DELETE http://127.0.0.1:5000/db/assignments/A1
```

#### GET `/db/assignments/progress`
Get assignment progress for a user with task completion details.

**Query Parameters:**
- `user_id` (required)
- `course_id` (optional)

**Response:**
```json
[
  {
    "assignment_id": "A1",
    "course_id": "COURSE123",
    "title": "Essay",
    "due_date": "2025-11-20",
    "completion_points": 200,
    "is_complete": false,
    "task_count": 5,
    "completed_task_count": 3,
    "percent_complete": 60
  }
]
```

**Example:**
```bash
# Get progress for all assignments for a user
curl "http://127.0.0.1:5000/db/assignments/progress?user_id=test_user"

# Get progress filtered by course
curl "http://127.0.0.1:5000/db/assignments/progress?user_id=test_user&course_id=CSC301"
```

### Course Endpoints

#### GET `/db/courses`
List all courses.

**Example:**
```bash
curl http://127.0.0.1:5000/db/courses
```

#### POST `/db/courses`
Create a new course.

**Request Body:**
```json
{
  "course_id": "CSC301",
  "user_id": "user_id",
  "course_name": "Introduction to Software Engineering",
  "course_code": "CSC301H1",
  "canvas_course_id": "optional_canvas_id",
  "term": "2025 Fall",
  "color": "blue"
}
```

**Note:** `course_id`, `user_id`, and `course_name` are required fields.

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/courses \
  -H 'Content-Type: application/json' \
  -d '{"course_id":"CSC301","user_id":"test_user","course_name":"Software Engineering","term":"2025 Fall","color":"blue"}'
```

#### GET `/db/courses/progress`
Get progress summary for all courses for a user.

**Query Parameters:**
- `user_id` (required)

**Response:**
```json
[
  {
    "course_id": "COURSE123",
    "course_name": "Intro to Testing",
    "color": "blue",
    "assignment_count": 5,
    "completed_assignment_count": 2,
    "task_count": 20,
    "completed_task_count": 15,
    "overall_percent": 62
  }
]
```

**Example:**
```bash
curl "http://127.0.0.1:5000/db/courses/progress?user_id=test_user"
```

### Blind Box & Gamification Endpoints

#### GET `/db/blind-box-series`
List all available blind box series.

**Response:**
```json
[
  {
    "series_id": "S1",
    "name": "Study Buddies",
    "description": "Cute study helpers",
    "cost_points": 50,
    "release_date": "2025-11-01"
  }
]
```

**Example:**
```bash
curl http://127.0.0.1:5000/db/blind-box-series
```

#### POST `/db/blind-box-series`
Create a new blind box series (admin).

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/blind-box-series \
  -H 'Content-Type: application/json' \
  -d '{"series_id":"S1","name":"Study Buddies","description":"Cute study companions","cost_points":50}'
```

#### DELETE `/db/blind-box-series/<series_id>`
Delete a blind box series (admin).

**Example:**
```bash
curl -X DELETE http://127.0.0.1:5000/db/blind-box-series/S1
```

#### GET `/db/blind-box-series/affordable`
Get blind box series that a user can afford.

**Query Parameters:**
- `user_id` (required)

**Response:**
```json
{
  "user_id": "paul_paw_test",
  "user_points": 500,
  "affordable_series": [
    {
      "series_id": "S1",
      "name": "Study Buddies",
      "cost_points": 50
    }
  ]
}
```

**Example:**
```bash
curl "http://127.0.0.1:5000/db/blind-box-series/affordable?user_id=test_user"
```

#### GET `/db/blind-box-figures`
List all figures, optionally filtered by series.

**Query Parameters:**
- `series_id` (optional)

**Example:**
```bash
# Get all figures
curl http://127.0.0.1:5000/db/blind-box-figures

# Get figures from a specific series
curl "http://127.0.0.1:5000/db/blind-box-figures?series_id=S1"
```

#### POST `/db/blind-box-figures`
Create a new blind box figure (admin).

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/db/blind-box-figures \
  -H 'Content-Type: application/json' \
  -d '{"figure_id":"F1","series_id":"S1","name":"Coffee Cat","rarity":"common","weight":5.0}'
```

#### DELETE `/db/blind-box-figures/<figure_id>`
Delete a blind box figure (admin).

**Example:**
```bash
curl -X DELETE http://127.0.0.1:5000/db/blind-box-figures/F1
```

#### POST `/db/blind-boxes/purchase`
Purchase a blind box and receive a random figure.

**Request Body:**
```json
{
  "user_id": "paul_paw_test",
  "series_id": "S1"  // optional - random affordable series if omitted
}
```

**Response:**
```json
{
  "status": "purchased",
  "purchase_id": "uuid",
  "series_id": "S1",
  "series_name": "Study Buddies",
  "cost_points": 50,
  "awarded_figure": {
    "figure_id": "F1",
    "name": "Cat Mentor",
    "rarity": "common"
  },
  "remaining_points": 450
}
```

**Example:**
```bash
# Purchase a specific series
curl -X POST http://127.0.0.1:5000/db/blind-boxes/purchase \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test_user","series_id":"S1"}'

# Purchase a random affordable series
curl -X POST http://127.0.0.1:5000/db/blind-boxes/purchase \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"test_user"}'
```

#### DELETE `/db/user-blind-boxes/<purchase_id>`
Delete a user's blind box purchase (admin/cleanup).

**Example:**
```bash
curl -X DELETE http://127.0.0.1:5000/db/user-blind-boxes/PURCHASE123
```

#### GET `/db/blind-boxes/preview`
Preview affordable series and user points (convenience endpoint).

**Query Parameters:**
- `user_id` (required)

**Example:**
```bash
curl "http://127.0.0.1:5000/db/blind-boxes/preview?user_id=test_user"
```

### Dashboard & Aggregation Endpoints

#### GET `/db/dashboard`
Get consolidated dashboard data in a single request.

**Query Parameters:**
- `user_id` (required)

**Response:**
```json
{
  "user": {
    "user_id": "paul_paw_test",
    "canvas_username": "Paul",
    "total_points": 500,
    "current_level": 3
  },
  "tasks": {
    "today": [
      {
        "task_id": "T1",
        "description": "Study for midterm",
        "scheduled_end_at": "2025-12-03T18:00:00Z",
        "is_completed": false
      }
    ],
    "upcoming": [
      {
        "task_id": "T2",
        "description": "Submit assignment",
        "scheduled_end_at": "2025-12-05T23:59:00Z"
      }
    ]
  },
  "courses": [
    {
      "course_id": "COURSE123",
      "course_name": "Software Engineering",
      "overall_percent": 75
    }
  ],
  "level_progress": {
    "current_level": 3,
    "next_level": 4,
    "progress_percent": 55
  }
}
```

**Example:**
```bash
curl "http://127.0.0.1:5000/db/dashboard?user_id=test_user"
```

### File Processing Endpoints

#### POST `/api/timetable/process`
Upload and process a timetable PDF to extract courses and generate recurring class tasks.

**Form Data:**
- `file` (PDF file) - Timetable PDF
- `user_id` (string) - User ID
- `term` (string) - e.g., "2025 Fall"
- `start_date` (ISO date) - Term start date
- `end_date` (ISO date) - Term end date

**Response:**
```json
{
  "status": "success",
  "courses_created": 5,
  "tasks_created": 120,
  "courses": [...],
  "tasks": [...]
}
```

**Example:**
```bash
curl -X POST http://127.0.0.1:5000/api/timetable/process \
  -F "file=@/path/to/timetable.pdf" \
  -F "user_id=test_user" \
  -F "term=2025 Fall" \
  -F "start_date=2025-09-01" \
  -F "end_date=2025-12-15"
```

**Note**: Syllabus processing endpoint (`/api/syllabi/process`) is currently commented out but available in code for AI-based assignment extraction.

## Points & Leveling System

### Earning Points
- Completing tasks: 10 points per task
- Completing assignments: Points based on `completion_points` field
- Manual point adjustments via user update endpoint

### Level Progression
Levels are based on total points accumulated:
- Level 1: 0-99 points
- Level 2: 100-299 points  
- Level 3: 300-599 points
- Level 4: 600-999 points
- Level 5+: Continues scaling

Progress percentage is calculated within the current level range.

## Development Notes

### Adding New Endpoints
1. Define route in `app/main.py`
2. Create/update repository in `database/` if needed
3. Add tests in `app/services/test_*_api.py`
4. Update this README

### Common Issues

**Import Errors**: Ensure you're running from the correct directory and the virtual environment is activated.

**Database Connection**: Verify `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`.

**File Upload Issues**: Check that `backend/app/storage/uploads/` directory exists and has write permissions.

**Test Failures**: Run `pytest -v` for verbose output. Ensure test database is properly configured.

## Related Documentation

- **Database Setup**: See `database/README.md` for schema details
- **Supabase Schema**: See `database/supabase_schema.sql` for table definitions
- **Frontend Integration**: Check frontend README for API consumption patterns

## Contributing

1. Create a feature branch from `main`
2. Make changes and add tests
3. Run `pytest` to ensure all tests pass
4. Update this README if adding new features or endpoints
5. Submit a pull request
