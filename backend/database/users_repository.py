from typing import List, Dict, Optional

from .db_client import DBClient


class UsersRepository:
    table = "users"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT user_id, canvas_username, total_points, current_level, last_activity_at FROM users"
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
        user_id: str,
        canvas_username: Optional[str] = None,
        total_points: int = 0,
        current_level: int = 0,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            # NOTE: Placeholder style may vary by driver; adjust if needed.
            cur.execute(
                """
                INSERT INTO users (user_id, canvas_username, total_points, current_level, last_activity_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (user_id, canvas_username, total_points, current_level),
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

    def fetch_by_id(self, user_id: str) -> Optional[Dict]:
        """Return a single user dict by user_id, or None if not found."""
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT user_id, canvas_username, total_points, current_level, last_activity_at
                FROM users
                WHERE user_id = ?
                """,
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            cols = [c[0] for c in cur.description] if cur.description else []
            return {cols[i]: row[i] for i in range(len(cols))}
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
