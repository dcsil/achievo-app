from typing import List, Dict, Optional

from .db_client import DBClient


class BlindBoxSeriesRepository:
    table = "blind_box_series"

    def fetch_all(self) -> List[Dict]:
        client = DBClient.connect()
        res = client.table(self.table).select("series_id,name,description,cost_points,release_date").execute()
        return res.data or []

    def fetch_affordable_series(self, user_points: int) -> List[Dict]:
        client = DBClient.connect()
        res = client.table(self.table).select("series_id,name,description,cost_points,release_date").lte("cost_points", user_points).execute()
        return res.data or []

    def fetch_by_id(self, series_id: str) -> Optional[Dict]:
        client = DBClient.connect()
        res = client.table(self.table).select("series_id,name,description,cost_points,release_date").eq("series_id", series_id).execute()
        rows = res.data or []
        return rows[0] if rows else None

    def create(
        self,
        series_id: str,
        name: str,
        description: str,
        cost_points: int,
        release_date: str = None,
    ) -> bool:
        client = DBClient.connect()
        payload = {
            "series_id": series_id,
            "name": name,
            "description": description,
            "cost_points": cost_points,
            "release_date": release_date,
        }
        # Remove None values
        clean_payload = {k: v for k, v in payload.items() if v is not None}
        _ = client.table(self.table).insert(clean_payload).execute()
        return True

    def delete(self, series_id: str) -> bool:
        client = DBClient.connect()
        res = client.table(self.table).delete().eq("series_id", series_id).execute()
        return bool(res.data)
