from typing import List, Dict, Optional

from .db_client import DBClient


class CoursesRepository:
    table = "courses"

    def fetch_all(self) -> List[Dict]:
        """Fetch all courses using Supabase client.

        Returns a list of dictionaries matching the selected columns.
        """
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(
                "course_id,user_id,course_name,course_code,canvas_course_id,date_imported_at,term,color"
            )
            .execute()
        )
        return res.data or []

    def fetch_by_id(self, course_id: str) -> Optional[Dict]:
        """Fetch a single course by ID using Supabase client.

        Returns a dictionary if found, otherwise None.
        """
        client = DBClient.connect()
        res = (
            client
            .table(self.table)
            .select(
                "course_id,user_id,course_name,course_code,canvas_course_id,date_imported_at,term,color"
            )
            .eq("course_id", course_id)
            .execute()
        )
        rows = res.data or []
        return rows[0] if rows else None

    def create(
        self,
        course_id: str,
        user_id: str,
        course_name: str,
        course_code: str = None,
        canvas_course_id: str = None,
        term: str = None,
        color: str = None,
    ) -> bool:
        """Create a course using Supabase client.

        date_imported_at is handled by DB default (CURRENT_TIMESTAMP).
        """
        client = DBClient.connect()
        _ = (
            client
            .table(self.table)
            .insert(
                {
                    "course_id": course_id,
                    "user_id": user_id,
                    "course_name": course_name,
                    "course_code": course_code,
                    "canvas_course_id": canvas_course_id,
                    "term": term,
                    "color": color,
                }
            )
            .execute()
        )
        # If no exception is raised, consider it success
        return True
