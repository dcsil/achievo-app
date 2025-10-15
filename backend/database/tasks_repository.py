from typing import List, Dict, Optional
from datetime import datetime

from .db_client import DBClient


class TasksRepository:
    table = "tasks"

    def fetch_all(self) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points FROM tasks"
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

    def fetch_by_user(
        self,
        user_id: str,
        scheduled_start_at: Optional[str] = None,
        scheduled_end_at: Optional[str] = None,
        assignment_id: Optional[str] = None,
        is_completed: Optional[bool] = None,
    ) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            
            query = "SELECT task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points FROM tasks WHERE user_id = ?"
            params = [user_id]
            
            if scheduled_start_at:
                query += " AND scheduled_start_at >= ?"
                params.append(scheduled_start_at)
            if scheduled_end_at:
                query += " AND scheduled_end_at <= ?"
                params.append(scheduled_end_at)
            if assignment_id:
                query += " AND assignment_id = ?"
                params.append(assignment_id)
            if is_completed is not None:
                query += " AND is_completed = ?"
                params.append(is_completed)
            
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

    def fetch_uncompleted_by_assignment(self, assignment_id: str) -> List[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points FROM tasks WHERE assignment_id = ? AND is_completed = FALSE",
                (assignment_id,)
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

    def fetch_by_id(self, task_id: str) -> Optional[Dict]:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                "SELECT task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points FROM tasks WHERE task_id = ?",
                (task_id,)
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

    def update(
        self,
        task_id: str,
        description: Optional[str] = None,
        scheduled_start_at: Optional[str] = None,
        scheduled_end_at: Optional[str] = None,
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            
            updates = []
            params = []
            
            if description is not None:
                updates.append("description = ?")
                params.append(description)
            if scheduled_start_at is not None:
                updates.append("scheduled_start_at = ?")
                params.append(scheduled_start_at)
            if scheduled_end_at is not None:
                updates.append("scheduled_end_at = ?")
                params.append(scheduled_end_at)
            
            if not updates:
                return False
            
            params.append(task_id)
            query = f"UPDATE tasks SET {', '.join(updates)} WHERE task_id = ?"
            
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

    def complete_task(self, task_id: str) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            
            completion_date = datetime.now().isoformat()
            
            cur.execute(
                "UPDATE tasks SET is_completed = TRUE, completion_date_at = ? WHERE task_id = ?",
                (completion_date, task_id)
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
    ) -> bool:
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO tasks (task_id, user_id, assignment_id, course_id, description, type, scheduled_start_at, scheduled_end_at, is_completed, completion_date_at, reward_points)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
                """,
                (
                    task_id,
                    user_id,
                    assignment_id,
                    course_id,
                    description,
                    type,
                    scheduled_start_at,
                    scheduled_end_at,
                    is_completed,
                    reward_points,
                ),
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

    def delete(self, task_id: str) -> bool:
        """Delete a task by task_id"""
        conn = None
        cur = None
        try:
            conn = DBClient.connect()
            cur = conn.cursor()
            cur.execute("DELETE FROM tasks WHERE task_id = ?", (task_id,))
            conn.commit()
            return cur.rowcount > 0
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
