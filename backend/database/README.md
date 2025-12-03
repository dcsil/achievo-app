# Database Module

This folder contains the database layer for the Achievo backend, using Supabase (managed PostgreSQL) as the database service.

## Architecture

The database layer follows a **repository pattern** with:
- **Schema file**: `supabase_schema.sql` - Complete database schema with tables and relationships
- **Client factory**: `db_client.py` - Creates Supabase client instances using environment variables
- **Repositories**: `*_repository.py` files - Data access objects (DAOs) that encapsulate all database queries for each entity (table)

## Key Files

- `supabase_schema.sql` - PostgreSQL schema with all tables, foreign keys, and constraints
- `db_client.py` - Supabase client factory using `SUPABASE_URL` and `SUPABASE_KEY`
- `users_repository.py` - User CRUD operations and authentication
- `courses_repository.py` - Course management
- `assignments_repository.py` - Assignment operations
- `tasks_repository.py` - Task CRUD and filtering
- `blind_box_series_repository.py` - Blind box series management
- `blind_box_figures_repository.py` - Figure management
- `user_blind_boxes_repository.py` - User purchases and inventory

### Prerequisites

- Python packages (already in `backend/requirements.txt`):
  - `supabase`
  - `python-dotenv`
  - `flask`, `flask-cors`

## Setup

### 1) Install dependencies

From the backend directory:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2) Configure environment variables

Create a `.env` file in the `backend/` directory with:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<anon-or-service-role-key>
```

### 3) Create the schema in Supabase

In the Supabase SQL Editor, copy and paste the contents of `supabase_schema.sql` and execute it.

**Tables created:**
- `users` - User accounts with email, password, Canvas integration, points, and levels
- `courses` - User's courses 
- `assignments` - Course assignments with due dates and completion tracking
- `tasks` - Individual tasks **(can be standalone or linked to assignments)**
- `blind_box_series` - Collectible series with cost and release info
- `blind_box_figures` - Individual figures with rarity and drop weights
- `user_blind_boxes` - User's purchased blind boxes and awarded figures

**Key relationships:**
- Courses belong to users 
- Assignments belong to courses 
- Tasks reference users, assignments, and courses
- Blind box figures belong to series 
- User purchases reference users, series, and figures

### 4) Start the backend server

See the main backend README for instructions on running the Flask API server. The repositories are used by the API endpoints defined in `app/main.py`.

## Repository Pattern Usage

Each repository file provides methods for database operations. Example:

```python
from database.users_repository import UsersRepository

# Initialize repository
users_repo = UsersRepository()

# Fetch a user
user = users_repo.fetch_by_id("test_user")

# Update user points
users_repo.update_points("test_user", 150)

# Create a new user
users_repo.create({
    "user_id": "new_user",
    "email": "newuser@example.com",
    "canvas_username": "newuser",
    "total_points": 0,
    "current_level": 1
})
```

## Common Operations

### Adding a New Table

1. Add table definition to `supabase_schema.sql`
2. Create a corresponding `*_repository.py` file with CRUD methods
3. Run the schema update in Supabase SQL Editor
4. Import and use the repository in `app/main.py`

### Modifying Existing Tables

1. Update schema in `supabase_schema.sql`
2. Apply ALTER TABLE commands in Supabase (or drop/recreate for dev)
3. Update corresponding repository methods if needed
4. Update API endpoints and tests accordingly

## Troubleshooting

**Connection errors**: Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`

**Foreign key violations**: Ensure parent records exist before creating child records (e.g., create user before creating courses)

