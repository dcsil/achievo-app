import React, { createContext, useContext, ReactNode } from 'react';

// Interfaces for timetable data
export interface Course {
  course_id: string;
  user_id: string;
  course_name: string;
  course_code: string;
  canvas_course_id: string;
  term: string;
  color: string;
  meeting_days: string[];
  meeting_times: string[];
  date_imported_at: string;
}

export interface GeneratedTask {
  task_id: string;
  user_id: string;
  assignment_id?: string;
  course_id: string;
  description: string;
  type: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  is_completed: boolean;
  reward_points: number;
}

export interface TimetableProcessResult {
  status: string;
  courses_found: number;
  tasks_generated: number;
  courses: Course[];
  tasks: GeneratedTask[];
  config: {
    user_id: string;
    term: string;
    assignment_id?: string;
    start_date: string;
    end_date: string;
    breaks: string[];
    holidays: string[];
  };
}

// API service for timetable operations
class TimetableApiService {
  private baseUrl = 'http://127.0.0.1:5000';

  async processTimetable(file: File, userId?: string): Promise<TimetableProcessResult> {
    const formData = new FormData();
    formData.append('file', file);

    // Add user_id if provided, otherwise backend will use default
    if (userId) {
      formData.append('user_id', userId);
    }

    const response = await fetch(`${this.baseUrl}/api/timetable/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process timetable');
    }

    return response.json();
  }

  async getCourses(userId?: string): Promise<Course[]> {
    const url = new URL(`${this.baseUrl}/db/courses`);
    if (userId) {
      url.searchParams.append('user_id', userId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch courses');
    }

    return response.json();
  }

  async createCourse(courseData: Omit<Course, 'date_imported_at'>): Promise<{ status: string; course_id: string }> {
    const response = await fetch(`${this.baseUrl}/db/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create course');
    }

    return response.json();
  }

  async bulkCreateCourses(courses: Course[]): Promise<{ created: number; errors: string[] }> {
    const results = {
      created: 0,
      errors: [] as string[]
    };

    for (const course of courses) {
      try {
        await this.createCourse(course);
        results.created++;
      } catch (error) {
        results.errors.push(`Failed to create ${course.course_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

// Context
interface TimetableContextType {
  timetableApi: TimetableApiService;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

// Provider component
interface TimetableProviderProps {
  children: ReactNode;
}

export const TimetableProvider: React.FC<TimetableProviderProps> = ({ children }) => {
  const timetableApi = new TimetableApiService();

  return (
    <TimetableContext.Provider value={{ timetableApi }}>
      {children}
    </TimetableContext.Provider>
  );
};

// Hook to use the context
export const useTimetable = (): TimetableContextType => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};

// Export the API service instance for direct use
export const timetableApiService = new TimetableApiService();