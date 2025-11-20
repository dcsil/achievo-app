import React, { createContext, useContext, ReactNode } from 'react';

// Course interface
export interface Course {
  course_id: string;
  user_id: string;
  course_name: string;
  course_code: string;
  canvas_course_id?: string;
  term: string;
  color: string;
  meeting_days: string[];
  meeting_times: string[];
  date_imported_at?: string;
}

// API service for adding course operations
class AddCoursesApiService {
  private baseUrl = 'http://127.0.0.1:5000';

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
interface AddCoursesContextType {
  addCoursesApi: AddCoursesApiService;
}

const AddCoursesContext = createContext<AddCoursesContextType | undefined>(undefined);

// Provider component
interface AddCoursesProviderProps {
  children: ReactNode;
}

export const AddCoursesProvider: React.FC<AddCoursesProviderProps> = ({ children }) => {
  const addCoursesApi = new AddCoursesApiService();

  return (
    <AddCoursesContext.Provider value={{ addCoursesApi }}>
      {children}
    </AddCoursesContext.Provider>
  );
};

// Hook to use the context
export const useAddCourses = (): AddCoursesContextType => {
  const context = useContext(AddCoursesContext);
  if (!context) {
    throw new Error('useAddCourses must be used within an AddCoursesProvider');
  }
  return context;
};

// Export the API service instance for direct use
export const addCoursesApiService = new AddCoursesApiService();
