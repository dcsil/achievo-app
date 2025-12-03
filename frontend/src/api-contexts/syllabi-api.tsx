import { getApiBaseUrl } from '../config/api';
import { Task, Assignment } from './get-assignments';

export interface SyllabiResult {
  status: string;
  course_id: string | null;
  assignments_found: number;
  tasks_found: number;
  total_micro_tasks: number;
  assignments: Array<Assignment & { micro_tasks: Task[] }>;
  tasks: Task[];
}

export interface BusyInterval {
  start: string;
  end: string;
}

export async function processSyllabus(
  file: File, 
  courseId?: string, 
  busyIntervals: BusyInterval[] = []
): Promise<SyllabiResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (courseId) {
      formData.append('course_id', courseId);
    }
    
    if (busyIntervals.length > 0) {
      formData.append('busy_intervals', JSON.stringify(busyIntervals));
    }

    const response = await fetch(`${getApiBaseUrl()}/api/syllabi/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result: SyllabiResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error processing syllabus:', error);
    throw error;
  }
}

// Helper function to validate PDF file
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  return { valid: true };
}

// Helper function to save assignments to database
export async function saveAssignmentsToDatabase(assignments: Assignment[]): Promise<void> {
  try {
    const results = await Promise.all(
      assignments.map(async (assignment) => {
        const response = await fetch(`${getApiBaseUrl()}/db/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assignment),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save assignment ${assignment.title}: ${errorData.error}`);
        }
        
        return await response.json();
      })
    );
    
    console.log('Successfully saved assignments:', results);
  } catch (error) {
    console.error('Error saving assignments to database:', error);
    throw error;
  }
}

// Helper function to save tasks to database
export async function saveTasksToDatabase(tasks: Task[]): Promise<void> {
  try {
    const results = await Promise.all(
      tasks.map(async (task) => {
        const response = await fetch(`${getApiBaseUrl()}/db/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save task ${task.description}: ${errorData.error}`);
        }
        
        return await response.json();
      })
    );
    
    console.log('Successfully saved tasks:', results);
  } catch (error) {
    console.error('Error saving tasks to database:', error);
    throw error;
  }
}

// Helper function to save complete syllabi data (assignments + tasks + micro-tasks)
export async function saveSyllabiDataToDatabase(result: SyllabiResult): Promise<{
  assignmentsSaved: number;
  tasksSaved: number;
  microTasksSaved: number;
}> {
  try {
    let assignmentsSaved = 0;
    let tasksSaved = 0;
    let microTasksSaved = 0;

    // Save standalone tasks (exams/quizzes)
    if (result.tasks.length > 0) {
      await saveTasksToDatabase(result.tasks);
      tasksSaved = result.tasks.length;
    }

    // Save assignments and their micro-tasks
    for (const assignment of result.assignments) {
      // Save assignment
      const { micro_tasks, ...assignmentData } = assignment;
      await saveAssignmentsToDatabase([assignmentData as Assignment]);
      assignmentsSaved++;

      // Save micro-tasks for this assignment
      if (micro_tasks && micro_tasks.length > 0) {
        await saveTasksToDatabase(micro_tasks);
        microTasksSaved += micro_tasks.length;
      }
    }

    return {
      assignmentsSaved,
      tasksSaved,
      microTasksSaved,
    };
  } catch (error) {
    console.error('Error saving syllabi data to database:', error);
    throw error;
  }
}
