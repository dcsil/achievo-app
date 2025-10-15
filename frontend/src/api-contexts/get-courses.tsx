// fetch courses from backend -- link to API calls in backend/app/main.py

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

export async function getCourses(userId: string = "paul_paw_test"): Promise<CourseForUI[]> {
  try {
    const response = await fetch('http://127.0.0.1:5000/db/courses');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses: Course[] = await response.json();
    console.log('Raw API response:', courses);
    
    // Filter courses for the specific user
    const userCourses = courses.filter(course => course.user_id === userId);
    console.log(`Filtered courses for user ${userId}:`, userCourses);
    
    // Map the API response to the UI format
    const coursesForUI: CourseForUI[] = userCourses.map(course => {
      console.log('Mapping course:', course);
      return {
        course_id: course.course_id || '',
        name: course.course_name || course.course_code || 'Unnamed Course',
        color: course.color || 'blue'
      };
    });
    
    console.log('Mapped courses for UI:', coursesForUI);
    
    return coursesForUI;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}
