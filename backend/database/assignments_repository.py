from typing import List, Dict, Optional

from .db_client import DBClient


class AssignmentsRepository:
    table = "assignments"

    def fetch_all(self) -> List[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select("assignment_id,course_id,title,due_date,completion_points,is_complete")
            .execute()
        )
        return res.data or []

    def fetch_by_id(self, assignment_id: str) -> Optional[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select("assignment_id,course_id,title,due_date,completion_points,is_complete")
            .eq("assignment_id", assignment_id)
            .execute()
        )
        rows = res.data or []
        return rows[0] if rows else None

    def fetch_with_filters(
        self,
        due_date: Optional[str] = None,
        title: Optional[str] = None,
        course_id: Optional[str] = None,
    ) -> List[Dict]:
        client = DBClient.connect()
        query = client.table(self.table).select(
            "assignment_id,course_id,title,due_date,completion_points,is_complete"
        )
        if due_date:
            query = query.eq("due_date", due_date)
        if title:
            # Supabase supports ilike for case-insensitive pattern
            query = query.ilike("title", f"%{title}%")
        if course_id:
            query = query.eq("course_id", course_id)
        res = query.execute()
        return res.data or []

    def update(
        self,
        assignment_id: str,
        title: Optional[str] = None,
        due_date: Optional[str] = None,
    ) -> bool:
        if title is None and due_date is None:
            return False
        update_fields: Dict = {}
        if title is not None:
            update_fields["title"] = title
        if due_date is not None:
            update_fields["due_date"] = due_date
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .update(update_fields)
            .eq("assignment_id", assignment_id)
            .execute()
        )
        return bool(res.data)

    def complete_assignment(self, assignment_id: str) -> bool:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .update({"is_complete": True})
            .eq("assignment_id", assignment_id)
            .execute()
        )
        return bool(res.data)

    def create(
        self,
        assignment_id: str,
        course_id: str,
        title: str,
        due_date: str,
        completion_points: int,
        is_complete: bool = False,
    ) -> bool:
        client = DBClient.connect()
        _ = (
            client
            .table(self.table)
            .insert(
                {
                    "assignment_id": assignment_id,
                    "course_id": course_id,
                    "title": title,
                    "due_date": due_date,
                    "completion_points": completion_points,
                    "is_complete": is_complete,
                }
            )
            .execute()
        )
        return True
