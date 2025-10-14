from typing import List, Dict

from .db_client import DBClient


class CoursesRepository:
    table = "courses"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT course_id, user_id, course_name, course_code, canvas_course_id, date_imported_at, term FROM courses"
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

    def create(self, course_id: str, user_id: str, course_name: str, course_code: str = None, canvas_course_id: str = None, term: str = None,) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO courses (course_id, user_id, course_name, course_code, canvas_course_id, date_imported_at, term)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                """,
                (course_id, user_id, course_name, course_code, canvas_course_id, term),
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
