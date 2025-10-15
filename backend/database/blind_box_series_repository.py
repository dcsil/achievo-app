from typing import List, Dict, Optional

from .db_client import DBClient


class BlindBoxSeriesRepository:
    table = "blind_box_series"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT series_id, name, description, cost_points, release_date FROM blind_box_series"
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

    def fetch_affordable_series(self, user_points: int) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT series_id, name, description, cost_points, release_date FROM blind_box_series WHERE cost_points <= ?",
                (user_points,)
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

    def fetch_by_id(self, series_id: str) -> Optional[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT series_id, name, description, cost_points, release_date FROM blind_box_series WHERE series_id = ?",
                (series_id,)
            )
            cols = [c[0] for c in cur.description] if cur.description else []
            row = cur.fetchone()
            if row:
                return {cols[i]: row[i] for i in range(len(cols))}
            return None
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
        series_id: str,
        name: str,
        description: str,
        cost_points: int,
        release_date: str = None,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO blind_box_series (series_id, name, description, cost_points, release_date)
                VALUES (?, ?, ?, ?, ?)
                """,
                (series_id, name, description, cost_points, release_date),
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

    def delete(self, series_id: str) -> bool:
        """Delete a blind box series by series_id"""
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute("DELETE FROM blind_box_series WHERE series_id = ?", (series_id,))
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
