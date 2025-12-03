from typing import List, Dict, Optional
from datetime import datetime

from .db_client import DBClient


class TasksRepository:
    table = "tasks"

    base_select = (
        "task_id,user_id,assignment_id,course_id,description,type," \
        "scheduled_start_at,scheduled_end_at,is_completed,completion_date_at,is_last_task,reward_points," \
        "courses(course_name,color)"
    )

    def _flatten(self, rows: List[Dict]) -> List[Dict]:
        """Flatten nested course object (if present) into course_name/course_color keys."""
        flattened = []
        for r in rows:
            course_info = r.get("courses")
            if isinstance(course_info, dict):
                r["course_name"] = course_info.get("course_name")
                r["course_color"] = course_info.get("color")
            elif isinstance(course_info, list) and course_info:
                r["course_name"] = course_info[0].get("course_name")
                r["course_color"] = course_info[0].get("color")
            r.pop("courses", None)
            flattened.append(r)
        return flattened

    def fetch_all(self) -> List[Dict]:
        client = DBClient.connect()
        res = client.table(self.table).select(self.base_select).execute()
        return self._flatten(res.data or [])

    def fetch_by_user(
        self,
        user_id: str,
        scheduled_start_at: Optional[str] = None,
        scheduled_end_at: Optional[str] = None,
        assignment_id: Optional[str] = None,
        is_completed: Optional[bool] = None,
    ) -> List[Dict]:
        client = DBClient.connect()
        query = client.table(self.table).select(self.base_select).eq("user_id", user_id)
        if scheduled_start_at:
            query = query.gte("scheduled_start_at", scheduled_start_at)
        if scheduled_end_at:
            query = query.lte("scheduled_end_at", scheduled_end_at)
        if assignment_id:
            query = query.eq("assignment_id", assignment_id)
        if is_completed is not None:
            query = query.eq("is_completed", is_completed)
        res = query.execute()
        return self._flatten(res.data or [])

    def fetch_uncompleted_by_assignment(self, assignment_id: str) -> List[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(self.base_select)
            .eq("assignment_id", assignment_id)
            .eq("is_completed", False)
            .execute()
        )
        return self._flatten(res.data or [])

    def fetch_by_id(self, task_id: str) -> Optional[Dict]:
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(self.base_select)
            .eq("task_id", task_id)
            .execute()
        )
        rows = self._flatten(res.data or [])
        return rows[0] if rows else None

    def update(
        self,
        task_id: str,
        description: Optional[str] = None,
        scheduled_start_at: Optional[str] = None,
        scheduled_end_at: Optional[str] = None,
    ) -> bool:
        if description is None and scheduled_start_at is None and scheduled_end_at is None:
            return False
        update_fields: Dict = {}
        if description is not None:
            update_fields["description"] = description
        if scheduled_start_at is not None:
            update_fields["scheduled_start_at"] = scheduled_start_at
        if scheduled_end_at is not None:
            update_fields["scheduled_end_at"] = scheduled_end_at
        client = DBClient.connect()
        res = client.table(self.table).update(update_fields).eq("task_id", task_id).execute()
        return bool(res.data)

    def complete_task(self, task_id: str) -> bool:
        completion_date = datetime.utcnow().isoformat()
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .update({"is_completed": True, "completion_date_at": completion_date})
            .eq("task_id", task_id)
            .execute()
        )
        return bool(res.data)

    def create(
        self,
        task_id: str,
        user_id: str,
        description: str,
        type: str,
        assignment_id: Optional[str] = None,
        course_id: Optional[str] = None,
        scheduled_start_at: Optional[str] = None,
        scheduled_end_at: Optional[str] = None,
        is_completed: bool = False,
        reward_points: int = 0,
        is_last_task: Optional[bool] = None,
    ) -> bool:
        payload = {
            "task_id": task_id,
            "user_id": user_id,
            "description": description,
            "type": type,
            "reward_points": reward_points,
            "is_completed": is_completed,
            "assignment_id": assignment_id,
            "course_id": course_id,
            "scheduled_start_at": scheduled_start_at,
            "scheduled_end_at": scheduled_end_at,
            "completion_date_at": None,
        }
        # For tasks linked to assignments, allow setting is_last_task; otherwise leave as NULL
        if assignment_id is not None:
            payload["is_last_task"] = is_last_task if is_last_task is not None else False
        clean_payload = {k: v for k, v in payload.items() if v is not None}
        client = DBClient.connect()
        _ = client.table(self.table).insert(clean_payload).execute()
        return True

    def delete(self, task_id: str) -> bool:
        client = DBClient.connect()
        res = client.table(self.table).delete().eq("task_id", task_id).execute()
        return bool(res.data)
