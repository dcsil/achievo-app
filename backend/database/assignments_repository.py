from typing import List, Dict, Optional

from .db_client import DBClient


class AssignmentsRepository:
    table = "assignments"

    def fetch_all(self) -> List[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select("assignment_id,course_id,title,due_date,completion_points,is_complete,actual_completion_date")
            .execute()
        )
        return res.data or []

    def fetch_by_id(self, assignment_id: str) -> Optional[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select("assignment_id,course_id,title,due_date,completion_points,is_complete,actual_completion_date")
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
            "assignment_id,course_id,title,due_date,completion_points,is_complete,actual_completion_date"
        )
        if due_date:
            query = query.eq("due_date", due_date)
        if title:
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
        actual_completion_date: Optional[str] = None,
    ) -> bool:
        if title is None and due_date is None and actual_completion_date is None:
            return False
        update_fields: Dict = {}
        if title is not None:
            update_fields["title"] = title
        if due_date is not None:
            update_fields["due_date"] = due_date
        if actual_completion_date is not None:
            update_fields["actual_completion_date"] = actual_completion_date
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
        from datetime import datetime
        completion_date = datetime.utcnow().isoformat()
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .update({"is_complete": True, "actual_completion_date": completion_date})
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
        actual_completion_date: Optional[str] = None,
    ) -> bool:
        client = DBClient.connect()
        payload = {
            "assignment_id": assignment_id,
            "course_id": course_id,
            "title": title,
            "due_date": due_date,
            "completion_points": completion_points,
            "is_complete": is_complete,
            "actual_completion_date": actual_completion_date,
        }
        clean_payload = {k: v for k, v in payload.items() if v is not None}
        _ = client.table(self.table).insert(clean_payload).execute()
        return True
