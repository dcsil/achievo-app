from typing import List, Dict, Optional

from .db_client import DBClient


class UsersRepository:
    table = "users"

    def fetch_all(self) -> List[Dict]:
        """Fetch all users via Supabase."""
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(
                # Skip pgsodium decryption for now - can be added back later when needed
                "user_id,canvas_username,canvas_domain,profile_picture,total_points,current_level,last_activity_at"
            )
            .execute()
        )
        return res.data or []

    def create(
        self,
        user_id: str,
        canvas_username: Optional[str] = None,
        canvas_domain: Optional[str] = None,
        canvas_api_key: Optional[str] = None,
        profile_picture: Optional[str] = None,
        total_points: int = 0,
        current_level: int = 0,
    ) -> bool:
        """Insert a user row. last_activity_at handled by DB default if present."""
        client = DBClient.connect()
        payload = {
            "user_id": user_id,
            "canvas_username": canvas_username,
            "canvas_domain": canvas_domain,
            # Do not select/return api key elsewhere; DB handles encryption at-rest.
            "canvas_api_key": canvas_api_key,
            "profile_picture": profile_picture,
            "total_points": total_points,
            "current_level": current_level,
        }
        _ = (
            client
            .table(self.table)
            .insert(payload)
            .execute()
        )
        return True

    def fetch_by_id(self, user_id: str) -> Optional[Dict]:
        """Return a single user dict by user_id, or None if not found."""
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(
                # Skip pgsodium decryption for now - can be added back later when needed
                "user_id,canvas_username,canvas_domain,profile_picture,total_points,current_level,last_activity_at"
            )
            .eq("user_id", user_id)
            .execute()
        )
        rows = res.data or []
        return rows[0] if rows else None

    def update_points(self, user_id: str, points_delta: int) -> bool:
        """Increment user's total_points by points_delta (can be negative)."""
        client = DBClient.connect()
        # Fetch current points first
        user = self.fetch_by_id(user_id)
        if not user:
            return False
        new_total = (user.get("total_points", 0) or 0) + points_delta
        res = (
            client
            .table(self.table)
            .update({"total_points": new_total})
            .eq("user_id", user_id)
            .execute()
        )
        return bool(res.data)

    def update_user_info(
        self,
        user_id: str,
        canvas_username: Optional[str] = None,
        canvas_domain: Optional[str] = None,
        canvas_api_key: Optional[str] = None,
        profile_picture: Optional[str] = None,
    ) -> bool:
        """Update user information. Only updates provided fields."""
        client = DBClient.connect()
        
        # Build update payload with only provided fields
        update_payload = {}
        if canvas_username is not None:
            update_payload["canvas_username"] = canvas_username
        if canvas_domain is not None:
            update_payload["canvas_domain"] = canvas_domain
        if canvas_api_key is not None:
            update_payload["canvas_api_key"] = canvas_api_key
        if profile_picture is not None:
            update_payload["profile_picture"] = profile_picture
            
        # Return False if no fields to update
        if not update_payload:
            return False
            
        res = (
            client
            .table(self.table)
            .update(update_payload)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(res.data)

    def delete(self, user_id: str) -> bool:
        """Delete a user by user_id."""
        client = DBClient.connect()
        res = client.table(self.table).delete().eq("user_id", user_id).execute()
        # Supabase returns deleted rows (if configured) or empty list
        return bool(res.data)
