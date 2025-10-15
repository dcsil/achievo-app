// fetch assignments from backend -- link to API calls in backend/app/main.py

export interface Task {
  task_id: string;
  user_id: string;
  description: string;
  type: string;
  assignment_id: string;
  course_id: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  is_completed: boolean;
  reward_points: number;
}

export interface Assignment {
  assignment_id: string;
  course_id: string;
  title: string;
  due_date: string;
  completion_points: number;
  is_complete: boolean;
  task_count?: number; // Number of tasks associated with this assignment
  completed_task_count?: number; // Number of completed tasks
}

// Helper function to get tasks for a specific assignment
async function getTasksForAssignment(assignmentId: string, userId: string = "default_user"): Promise<Task[]> {
  try {
    const response = await fetch(`http://127.0.0.1:5000/db/tasks?user_id=${userId}&assignment_id=${assignmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tasks: Task[] = await response.json();
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks for assignment:', error);
    return []; // Return empty array on error
  }
}

export async function getAssignments(courseId: string, userId: string = "default_user"): Promise<Assignment[]> {
  try {
    const response = await fetch(`http://127.0.0.1:5000/db/assignments?course_id=${courseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const assignments: Assignment[] = await response.json();
    
    // For each assignment, fetch the associated tasks to get task count
    const assignmentsWithTaskCounts = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const tasks = await getTasksForAssignment(assignment.assignment_id, userId);
          const completedTasks = tasks.filter(task => task.is_completed);
          
          return {
            ...assignment,
            task_count: tasks.length,
            completed_task_count: completedTasks.length
          };
        } catch (error) {
          console.error(`Error fetching tasks for assignment ${assignment.assignment_id}:`, error);
          // Return assignment with default task counts on error
          return {
            ...assignment,
            task_count: 0,
            completed_task_count: 0
          };
        }
      })
    );

    return assignmentsWithTaskCounts;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}