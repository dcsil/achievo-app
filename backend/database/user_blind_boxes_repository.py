from typing import List, Dict, Optional

from .db_client import DBClient


class UserBlindBoxesRepository:
    table = "user_blind_boxes"

    join_select = (
        "purchase_id,user_id,series_id,purchased_at,opened_at,awarded_figure_id," \
        "blind_box_figures(name,rarity,image),blind_box_series(name,image)"
    )

    def _flatten(self, rows: List[Dict]) -> List[Dict]:
        flattened = []
        for r in rows:
            fig = r.get("blind_box_figures")
            ser = r.get("blind_box_series")
            if isinstance(fig, dict):
                r["figure_name"] = fig.get("name")
                r["figure_rarity"] = fig.get("rarity")
                r["figure_image"] = fig.get("image")
            elif isinstance(fig, list) and fig:
                r["figure_name"] = fig[0].get("name")
                r["figure_rarity"] = fig[0].get("rarity")
                r["figure_image"] = fig[0].get("image")
            if isinstance(ser, dict):
                r["series_name"] = ser.get("name")
                r["series_image"] = ser.get("image")
            elif isinstance(ser, list) and ser:
                r["series_name"] = ser[0].get("name")
                r["series_image"] = ser[0].get("image")
            r.pop("blind_box_figures", None)
            r.pop("blind_box_series", None)
            flattened.append(r)
        return flattened

    def fetch_all(self) -> List[Dict]:
        client = DBClient.connect()
        res = client.table(self.table).select("purchase_id,user_id,series_id,purchased_at,opened_at,awarded_figure_id").execute()
        return res.data or []

    def fetch_by_user(self, user_id: str) -> List[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(self.join_select)
            .eq("user_id", user_id)
            .execute()
        )
        return self._flatten(res.data or [])

    def create(
        self,
        purchase_id: str,
        user_id: str,
        series_id: str,
        purchased_at: str,
        opened_at: Optional[str] = None,
        awarded_figure_id: Optional[str] = None,
    ) -> bool:
        payload = {
            "purchase_id": purchase_id,
            "user_id": user_id,
            "series_id": series_id,
            "purchased_at": purchased_at,
            "opened_at": opened_at,
            "awarded_figure_id": awarded_figure_id,
        }
        clean_payload = {k: v for k, v in payload.items() if v is not None}
        client = DBClient.connect()
        _ = client.table(self.table).insert(clean_payload).execute()
        return True

    def delete(self, purchase_id: str) -> bool:
        client = DBClient.connect()
        res = client.table(self.table).delete().eq("purchase_id", purchase_id).execute()
        return bool(res.data)
