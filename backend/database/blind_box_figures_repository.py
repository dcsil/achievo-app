from typing import List, Dict, Optional
import random

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

    def fetch_by_series(self, series_id: str) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT figure_id, series_id, name, rarity, weight FROM blind_box_figures WHERE series_id = ?",
                (series_id,)
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

    def select_random_figure(self, series_id: str) -> Optional[Dict]:
        """Select a random figure from a series based on weighted probability"""
        figures = self.fetch_by_series(series_id)
        
        if not figures:
            return None
        
        # Extract figures and their weights
        weights = [fig.get('weight', 1.0) for fig in figures]
        
        # Use random.choices for weighted random selection
        selected_figure = random.choices(figures, weights=weights, k=1)[0]
        
        return selected_figure

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
