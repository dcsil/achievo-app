from databricks import sql
import os
import sys
import time
from typing import List, Tuple, Dict
import ssl
import urllib3
from dotenv import load_dotenv

def push_rows():
    """Push a list of (id, name) rows into the demo table.

    Expects the env vars DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH, DATABRICKS_TOKEN to be set.
    """
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

    server_hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
    http_path = os.getenv("DATABRICKS_HTTP_PATH")
    token = os.getenv("DATABRICKS_TOKEN")

    if not (server_hostname and http_path and token):
        print("ERROR: please set DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH and DATABRICKS_TOKEN environment variables.")
        sys.exit(1)

    connection = None
    cursor = None
    try:
        connection = sql.connect(server_hostname=server_hostname, http_path=http_path, access_token=token, _tls_no_verify=True)
        print("connected")
        cursor = connection.cursor()

        # Ensure the desired database is selected if needed
        # cursor.execute("USE schedules_db")

        create_all_tables(cursor)
        add_dummy_data(cursor)
        connection.commit()

        # select all data to verify
        cursor.execute("SELECT * FROM users")
        print("\n---- Users Table Data ----")
        for row in cursor.fetchall():
            print(row)

        print("\n---- Courses Table Data ----")
        cursor.execute("SELECT * FROM courses")
        for row in cursor.fetchall():
            print(row)

        print("\n---- Assignments Table Data ----")
        cursor.execute("SELECT * FROM assignments")
        for row in cursor.fetchall():
            print(row)

        print("\n---- Tasks Table Data ----")
        cursor.execute("SELECT * FROM tasks")
        for row in cursor.fetchall():
            print(row)

        print("\n---- Blind Box Series Table Data ----")
        cursor.execute("SELECT * FROM blind_box_series")
        for row in cursor.fetchall():
            print(row)

        print("\n---- Blind Box Figures Table Data ----")
        cursor.execute("SELECT * FROM blind_box_figures")
        for row in cursor.fetchall():
            print(row)

        print("\n---- User Blind Boxes Table Data ----")
        cursor.execute("SELECT * FROM user_blind_boxes")
        for row in cursor.fetchall():
            print(row)

    except Exception as e:
        print("ERROR while running DB operations:", type(e), e)
        raise
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except Exception:
            pass
        try:
            if connection is not None:
                connection.close()
        except Exception:
            pass


# def create_database(cursor):
#     cursor.execute("CREATE DATABASE IF NOT EXISTS schedules_db")

# def add_class_schedule_data(cursor):
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS schedule (
#             student STRING,
#             course  STRING,
#             start_time STRING,
#             end_time   STRING
#         )
#     """)

#     cursor.execute("""
#         INSERT INTO schedule (student, course, start_time, end_time) VALUES
#         ('Alice', 'Biology', '09:00', '11:00'),
#         ('Alice', 'Math', '13:00', '14:30'),
#         ('Bob',   'History', '10:00', '12:00'),
#         ('Bob',   'Chemistry', '14:00', '15:30')
#     """)

#     print("Inserted sample data ✅")

# def add_deadlines_data(cursor):
#     cursor.execute("""
#     CREATE TABLE IF NOT EXISTS assignments (
#         student STRING,
#         course  STRING,
#         assignment STRING,
#         due_date  STRING
#     )
# """)
#     cursor.execute("""
#     INSERT INTO assignments (student, course, assignment, due_date) VALUES
#     ('Alice', 'Biology', 'Lab Report 1', '2025-09-25'),
#     ('Alice', 'Math', 'Problem Set 2', '2025-09-28'),
#     ('Bob',   'History', 'Essay Draft', '2025-09-30'),
#     ('Bob',   'Chemistry', 'Experiment Notes', '2025-10-02')
# """)
#     # print("Inserted sample data ✅")


def create_users_table(cursor):
    """Create the users table (stores student accounts and gamification state)."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        canvas_username VARCHAR(255),
        canvas_domain STRING,
        canvas_api_key STRING,
        profile_picture STRING,
        total_points INT NOT NULL,
        current_level INT NOT NULL,
        last_activity_at TIMESTAMP
    )
    """)


def create_courses_table(cursor):
    """Create the courses table."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        course_id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(50),
        canvas_course_id VARCHAR(100),
        date_imported_at TIMESTAMP NOT NULL,
        term VARCHAR(50),
        color VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
    """)


def create_assignments_table(cursor):
    """Create the assignments table (major academic assignments)."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
        assignment_id VARCHAR(50) PRIMARY KEY,
        course_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        due_date TIMESTAMP NOT NULL,
        completion_points INT NOT NULL,
        is_complete BOOLEAN NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
    )
    """)


def create_tasks_table(cursor):
    """Create the tasks table. Tasks can be linked to assignments or standalone personal tasks."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        task_id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        assignment_id VARCHAR(50),
        course_id VARCHAR(50),
        description STRING NOT NULL,
        type VARCHAR(50) NOT NULL,
        scheduled_start_at TIMESTAMP,
        scheduled_end_at TIMESTAMP,
        is_completed BOOLEAN NOT NULL,
        completion_date_at TIMESTAMP,
        reward_points INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
    )
    """)


def create_blind_box_series_table(cursor):
    """Create blind_box_series table: defines a series of blind boxes (e.g., Series A)."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blind_box_series (
        series_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description STRING,
        cost_points INT NOT NULL,
        release_date TIMESTAMP
    )
    """)


def create_blind_box_figures_table(cursor):
    """Create blind_box_figures table: all possible figures within a series."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blind_box_figures (
        figure_id VARCHAR(50) PRIMARY KEY,
        series_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        rarity VARCHAR(50),
        weight FLOAT, -- relative probability weight for random draws
        FOREIGN KEY (series_id) REFERENCES blind_box_series(series_id)
    )
    """)


def create_user_blindbox_table(cursor):
    """Track blind box purchases/opens and resulting figure awards."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_blind_boxes (
        purchase_id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        series_id VARCHAR(50) NOT NULL,
        purchased_at TIMESTAMP NOT NULL,
        opened_at TIMESTAMP,
        awarded_figure_id VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (series_id) REFERENCES blind_box_series(series_id),
        FOREIGN KEY (awarded_figure_id) REFERENCES blind_box_figures(figure_id)
    )
    """)


def create_all_tables(cursor):
    """Helper to create all schema tables inside schedules_db. Assumes DB selected."""
    create_users_table(cursor)
    create_courses_table(cursor)
    create_assignments_table(cursor)
    create_tasks_table(cursor)
    create_blind_box_series_table(cursor)
    create_blind_box_figures_table(cursor)
    create_user_blindbox_table(cursor)
    print("Created all tables ✅")


def add_dummy_data(cursor):
    """Insert sample/dummy rows into the new tables for development and testing."""
    cursor.execute("""
    INSERT INTO users (user_id, canvas_username, total_points, current_level, last_activity_at) VALUES
    ('user_1', 'alice_canvas', 120, 3, '2025-10-01 08:30:00'),
    ('user_2', 'bob_canvas', 45, 1, '2025-09-30 21:15:00')
    """)

    cursor.execute("""
    INSERT INTO courses (course_id, user_id, course_name, course_code, canvas_course_id, date_imported_at, term, color) VALUES
    ('course_1', 'user_1', 'Intro to Computer Science', 'CS101', 'canvas_123', '2025-09-01 10:00:00', 'Fall 2025', '#3B82F6'),
    ('course_2', 'user_2', 'World History', 'HIST201', NULL, '2025-09-02 11:00:00', 'Fall 2025', '#EF4444')
    """)

    cursor.execute("""
    INSERT INTO assignments (assignment_id, course_id, title, due_date, completion_points, is_complete) VALUES
    ('assign_1', 'course_1', 'Project Proposal', '2025-10-15 23:59:00', 50, FALSE),
    ('assign_2', 'course_1', 'Midterm Exam', '2025-10-22 09:00:00', 100, FALSE)
    """)

    cursor.execute("""
    INSERT INTO tasks (task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points) VALUES
    ('task_1', 'user_1', 'assign_1', 'course_1', 'Outline proposal structure', 'MicroDeadline', '2025-10-10 18:00:00', '2025-10-10 20:00:00', FALSE, NULL, 10),
    ('task_2', 'user_1', NULL, NULL, 'Go to Gym', 'Personal', '2025-10-09 07:00:00', '2025-10-09 08:00:00', TRUE, '2025-10-09 08:00:00', 0)
    """)

    cursor.execute("""
    INSERT INTO blind_box_series (series_id, name, description, cost_points, release_date) VALUES
    ('series_A', 'Series A', 'First blind box series with classic figures', 25, '2025-09-01 00:00:00'),
    ('series_B', 'Series B', 'Limited edition fall series', 50, '2025-10-01 00:00:00')
    """)

    cursor.execute("""
    INSERT INTO blind_box_figures (figure_id, series_id, name, rarity, weight) VALUES
    ('fig_A_1', 'series_A', 'Figure A1', 'common', 50.0),
    ('fig_A_2', 'series_A', 'Figure A2', 'common', 30.0),
    ('fig_A_3', 'series_A', 'Figure A3', 'rare', 15.0),
    ('fig_A_4', 'series_A', 'Figure A4', 'epic', 4.0),
    ('fig_A_5', 'series_A', 'Figure A5', 'legendary', 1.0)
    """)

    cursor.execute("""
    INSERT INTO blind_box_figures (figure_id, series_id, name, rarity, weight) VALUES
    ('fig_B_1', 'series_B', 'Figure B1', 'common', 60.0),
    ('fig_B_2', 'series_B', 'Figure B2', 'rare', 25.0),
    ('fig_B_3', 'series_B', 'Figure B3', 'epic', 10.0),
    ('fig_B_4', 'series_B', 'Figure B4', 'legendary', 5.0)
    """)

    cursor.execute("""
    INSERT INTO user_blind_boxes (purchase_id, user_id, series_id, purchased_at, opened_at, awarded_figure_id) VALUES
    ('pb_1', 'user_1', 'series_A', '2025-09-10 12:00:00', '2025-09-10 12:00:05', 'fig_A_3'),
    ('pb_2', 'user_1', 'series_B', '2025-09-20 15:30:00', NULL, NULL)
    """)

    print("Inserted dummy data into users/courses/assignments/tasks and blind-box tables ✅")


if __name__ == "__main__":

    # ssl._create_default_https_context = ssl._create_unverified_context

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    push_rows()

    print("Done.")