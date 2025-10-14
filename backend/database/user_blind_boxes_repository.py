from typing import List, Dict, Optional

from .db_client import DBClient


class UserBlindBoxesRepository:
    table = "user_blind_boxes"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT purchase_id, user_id, series_id, purchased_at, opened_at, awarded_figure_id FROM user_blind_boxes"
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
        purchase_id: str,
        user_id: str,
        series_id: str,
        purchased_at: str,
        opened_at: Optional[str] = None,
        awarded_figure_id: Optional[str] = None,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO user_blind_boxes (purchase_id, user_id, series_id, purchased_at, opened_at, awarded_figure_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (purchase_id, user_id, series_id, purchased_at, opened_at, awarded_figure_id),
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
