from typing import List, Dict, Optional

from .db_client import DBClient


class TasksRepository:
    table = "tasks"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points FROM tasks"
            )
            cols = [c[0] for c in cur.description] if cur.description else []
            rows = cur.fetchall()
            return [{cols[i]: row[i] for i in range(len(cols))} for row in rows]
        finally:
            try:
                if cur is not None:
                    cur.close()
            except Exception:
                pass
            try:
                if conn is not None:
                    conn.close()
            except Exception:
                pass

    def create(
        self,
        task_id: str,
        user_id: str,
        description: str,
        type: str,
        assignment_id: Optional[str] = None,
        course_id: Optional[str] = None,
        scheduled_start_at: Optional[str] = None,
        scheduled_end_at: Optional[str] = None,
        is_completed: bool = False,
        reward_points: int = 0,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO tasks (task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
                """,
                (
                    task_id,
                    user_id,
                    assignment_id,
                    course_id,
                    description,
                    type,
                    scheduled_start_at,
                    scheduled_end_at,
                    is_completed,
                    reward_points,
                ),
            )
            conn.commit()
            return True
        finally:
            try:
                if cur is not None:
                    cur.close()
            except Exception:
                pass
            try:
                if conn is not None:
                    conn.close()
            except Exception:
                pass
