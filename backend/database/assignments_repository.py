from typing import List, Dict, Optional

from .db_client import DBClient


class AssignmentsRepository:
    table = "assignments"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT assignment_id, course_id, title, due_date, completion_points, is_complete FROM assignments"
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

    def fetch_by_id(self, assignment_id: str) -> Optional[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT assignment_id, course_id, title, due_date, completion_points, is_complete FROM assignments WHERE assignment_id = ?",
                (assignment_id,)
            )
            cols = [c[0] for c in cur.description] if cur.description else []
            row = cur.fetchone()
            if row:
                return {cols[i]: row[i] for i in range(len(cols))}
            return None
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

    def fetch_with_filters(
        self,
        due_date: Optional[str] = None,
        title: Optional[str] = None,
        course_id: Optional[str] = None,
    ) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            
            query = "SELECT assignment_id, course_id, title, due_date, completion_points, is_complete FROM assignments WHERE 1=1"
            params = []
            
            if due_date:
                query += " AND due_date = ?"
                params.append(due_date)
            if title:
                query += " AND title LIKE ?"
                params.append(f"%{title}%")
            if course_id:
                query += " AND course_id = ?"
                params.append(course_id)
            
            cur.execute(query, tuple(params))
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

    def update(
        self,
        assignment_id: str,
        title: Optional[str] = None,
        due_date: Optional[str] = None,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            
            updates = []
            params = []
            
            if title is not None:
                updates.append("title = ?")
                params.append(title)
            if due_date is not None:
                updates.append("due_date = ?")
                params.append(due_date)
            
            if not updates:
                return False
            
            params.append(assignment_id)
            query = f"UPDATE assignments SET {', '.join(updates)} WHERE assignment_id = ?"
            
            cur.execute(query, tuple(params))
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

    def complete_assignment(self, assignment_id: str) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            
            cur.execute(
                "UPDATE assignments SET is_complete = TRUE WHERE assignment_id = ?",
                (assignment_id,)
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

    def create(
        self,
        assignment_id: str,
        course_id: str,
        title: str,
        due_date: str,
        completion_points: int,
        is_complete: bool = False,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO assignments (assignment_id, course_id, title, due_date, completion_points, is_complete)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (assignment_id, course_id, title, due_date, completion_points, is_complete),
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
