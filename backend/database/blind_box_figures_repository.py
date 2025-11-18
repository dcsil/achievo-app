from typing import List, Dict, Optional
import random

from .db_client import DBClient


class BlindBoxFiguresRepository:
    table = "blind_box_figures"

    def fetch_all(self) -> List[Dict]:
        client = DBClient.connect()
        res = client.table(self.table).select("figure_id,series_id,name,rarity,weight,image").execute()
        return res.data or []

    def fetch_by_series(self, series_id: str) -> List[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select("figure_id,series_id,name,rarity,weight,image")
            .eq("series_id", series_id)
            .execute()
        )
        return res.data or []

    def select_random_figure(self, series_id: str) -> Optional[Dict]:
        """Select a random figure from a series based on weighted probability"""
        figures = self.fetch_by_series(series_id)
        if not figures:
            return None
        weights = [fig.get('weight', 1.0) for fig in figures]
        selected_figure = random.choices(figures, weights=weights, k=1)[0]
        return selected_figure

    def create(
        self,
        figure_id: str,
        series_id: str,
        name: str,
        rarity: str,
        weight: float,
        image: Optional[str] = None,
    ) -> bool:
        client = DBClient.connect()
        payload = {
            "figure_id": figure_id,
            "series_id": series_id,
            "name": name,
            "rarity": rarity,
            "weight": weight,
            "image": image,
        }
        clean_payload = {k: v for k, v in payload.items() if v is not None}
        _ = client.table(self.table).insert(clean_payload).execute()
        return True

    def delete(self, figure_id: str) -> bool:
        client = DBClient.connect()
        res = client.table(self.table).delete().eq("figure_id", figure_id).execute()
        return bool(res.data)
