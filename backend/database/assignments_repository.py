from typing import List, Dict

from .db_client import DBClient


class AssignmentsRepository:
    table = "assignments"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT assignment_id, course_id, title, due_date, completion_points, is_complete FROM assignments"
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
        assignment_id: str,
        course_id: str,
        title: str,
        due_date: str,
        completion_points: int,
        is_complete: bool = False,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO assignments (assignment_id, course_id, title, due_date, completion_points, is_complete)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (assignment_id, course_id, title, due_date, completion_points, is_complete),
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
