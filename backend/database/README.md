## Database setup (Supabase) and local testing

This folder targets Supabase (managed PostgreSQL). We have a schema file and the repositories use the Supabase Python client.

Key files:
- `supabase_schema_simple.sql` — single, minimal schema (tables + FKs only)
- `db_client.py` — creates a Supabase client using `SUPABASE_URL` and `SUPABASE_KEY`

### Prerequisites

- Python packages (already in `backend/requirements.txt`):
  - `supabase`
  - `python-dotenv`
  - `flask`, `flask-cors`

### 1) Install dependencies

From repo root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2) Configure environment variables (.env)

`db_client.py` will load a `.env` from `backend/.env` or from your environment. Define:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<anon-or-service-role-key>
```

### 3) Create the schema in Supabase

In the Supabase SQL Editor, run the queries in `supabase_schema_simple.sql`

Tables created:
- `users`, `courses`, `assignments`, `tasks`, `blind_box_series`, `blind_box_figures`, `user_blind_boxes`

### 4) Run the backend API locally

From repo root:

```bash
python backend/app/main.py
```

The server starts at http://127.0.0.1:5000.

### 5) Sanity check endpoints

Create a user:

```bash
curl -X POST http://127.0.0.1:5000/db/users \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"user_456","canvas_username":"alice_canvas","total_points":0,"current_level":0}'
```

Create a course for that user:

```bash
curl -X POST http://127.0.0.1:5000/db/courses \
  -H 'Content-Type: application/json' \
  -d '{"course_id":"COURSE123","user_id":"user_456","course_name":"Intro to Systems"}'
```

Create an assignment and a task:

```bash
curl -X POST http://127.0.0.1:5000/db/assignments \
  -H 'Content-Type: application/json' \
  -d '{"assignment_id":"A1","course_id":"COURSE123","title":"Read Chapter 1","due_date":"2025-11-20T00:00:00Z","completion_points":50}'

curl -X POST http://127.0.0.1:5000/db/tasks \
  -H 'Content-Type: application/json' \
  -d '{"task_id":"T1","user_id":"user_456","description":"Outline notes","type":"study","assignment_id":"A1","course_id":"COURSE123","reward_points":10}'
```

Blind box sample flow:

```bash
curl -X POST http://127.0.0.1:5000/db/blind-box-series \
  -H 'Content-Type: application/json' \
  -d '{"series_id":"S1","name":"Study Buddies","description":"Cute helpers","cost_points":50}'

curl -X POST http://127.0.0.1:5000/db/blind-box-figures \
  -H 'Content-Type: application/json' \
  -d '{"figure_id":"F1","series_id":"S1","name":"Coffee Cat","rarity":"common","weight":5}'

curl -X POST http://127.0.0.1:5000/db/blind-boxes/purchase \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"user_456","series_id":"S1"}'
```

### Reruns and resets

To drop tables in Supabase for a clean reset:

```sql
DROP TABLE IF EXISTS user_blind_boxes;
DROP TABLE IF EXISTS blind_box_figures;
DROP TABLE IF EXISTS blind_box_series;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
```

Re-run the schema script afterwards.
