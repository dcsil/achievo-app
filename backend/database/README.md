## Database setup and local seeding

This folder contains the Databricks SQL schema and a small seeding script for local/dev use. The entry point is `database_module.py`, which:

- connects to a Databricks SQL Warehouse using env vars
- creates all required tables (idempotent CREATE TABLE IF NOT EXISTS)
- inserts a small set of dummy rows for development
- prints out the data for a quick sanity check

Note: This module targets a Databricks SQL Warehouse, not a local SQLite/Postgres instance.

### Prerequisites

- The following Python packages (already listed in `backend/requirements.txt`):
  - `databricks-sql-connector`
  - `python-dotenv`

### 1) Install dependencies

From the repo root or the `backend` directory:

```bash
# From repo root
cd backend

# (Optiona but I would recommend) create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install the backend dependencies
pip install -r requirements.txt
```

### 2) Configure environment variables (.env)

`database_module.py` and `db_client.py` load a `.env` file from this folder. **Add it to this folder.**


### 3) Run the schema + dummy data seeding

Run the module with Python. From the `backend` directory:

```bash
# Ensure you're in the backend directory (so relative imports/paths resolve)
cd backend

# Run the seeding script
python3 database/database_module.py
```

What this does:

- Connects to your SQL Warehouse
- Creates the following tables (if they don’t already exist):
  - `users`, `courses`, `assignments`, `tasks`, `blind_box_series`, `blind_box_figures`, `user_blind_boxes`
- Inserts a few example rows into each
- Prints the contents of each table

If you prefer module-style invocation from the repo root:

```bash
python3 -m backend.database.database_module
```

### Reruns and resets

- The script uses `CREATE TABLE IF NOT EXISTS`, so tables persist across runs.
- Inserts are unconditional, so rerunning can create duplicate data or constraint conflicts depending on your Databricks/Unity Catalog settings.

To reset, you can drop the tables in your Databricks SQL editor (or run once via a temporary script):

```sql
DROP TABLE IF EXISTS user_blind_boxes;
DROP TABLE IF EXISTS blind_box_figures;
DROP TABLE IF EXISTS blind_box_series;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
```

Then re-run the seeding script.

### Running the database APIs locally

The Flask app in `backend/app/main.py` exposes simple endpoints for the `users` table. This is handy to sanity‑check DB connectivity via the repository layer.

1) Start the backend server:

```bash
cd backend
python3 app/main.py
```

By default it starts on http://127.0.0.1:5000.

2) Test the users endpoints:

- Create a NEW user

```bash
curl -X POST http://127.0.0.1:5000/db/users \
  -H 'Content-Type: application/json' \
  -d '{
        "user_id": "user_123",
        "canvas_username": "alice_canvas",
        "total_points": 10,
        "current_level": 1
      }'
```

- Fetch all users

```bash
curl 'http://127.0.0.1:5000/db/users'
```

- Fetch one user by id

```bash
curl 'http://127.0.0.1:5000/db/users?user_id=user_123'
```
