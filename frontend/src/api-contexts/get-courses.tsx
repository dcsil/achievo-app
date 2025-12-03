export interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
  canvas_course_id: string;
  color: string;
  date_imported_at: string;
  user_id: string;
}

export interface CourseForUI {
  course_id: string;
  name: string;
  color: string;
}

export async function getCourses(userId: string): Promise<CourseForUI[]> {
  try {
    const response = await fetch('http://127.0.0.1:5000/db/courses');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses: Course[] = await response.json();
    
    const userCourses = courses.filter(course => course.user_id === userId);
    
    const coursesForUI: CourseForUI[] = userCourses.map(course => {
      return {
        course_id: course.course_id || '',
        name: course.course_name || course.course_code || 'Unnamed Course',
        color: course.color || 'blue'
      };
    });
        
    return coursesForUI;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}
