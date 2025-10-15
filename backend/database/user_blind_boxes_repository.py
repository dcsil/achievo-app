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

    def fetch_by_user(self, user_id: str) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT 
                    ubb.purchase_id, 
                    ubb.user_id, 
                    ubb.series_id, 
                    ubb.purchased_at, 
                    ubb.opened_at, 
                    ubb.awarded_figure_id,
                    bbf.name as figure_name,
                    bbf.rarity as figure_rarity,
                    bbs.name as series_name
                FROM user_blind_boxes ubb
                LEFT JOIN blind_box_figures bbf ON ubb.awarded_figure_id = bbf.figure_id
                LEFT JOIN blind_box_series bbs ON ubb.series_id = bbs.series_id
                WHERE ubb.user_id = ?
                """,
                (user_id,)
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

    def delete(self, purchase_id: str) -> bool:
        """Delete a user blind box purchase by purchase_id"""
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute("DELETE FROM user_blind_boxes WHERE purchase_id = ?", (purchase_id,))
            conn.commit()
            return cur.rowcount > 0
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
