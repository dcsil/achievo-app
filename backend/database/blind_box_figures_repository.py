from typing import List, Dict

from .db_client import DBClient


class BlindBoxFiguresRepository:
    table = "blind_box_figures"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT figure_id, series_id, name, rarity, weight FROM blind_box_figures"
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
        figure_id: str,
        series_id: str,
        name: str,
        rarity: str,
        weight: float,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO blind_box_figures (figure_id, series_id, name, rarity, weight)
                VALUES (?, ?, ?, ?, ?)
                """,
                (figure_id, series_id, name, rarity, weight),
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
