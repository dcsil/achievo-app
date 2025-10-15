// fetch courses from backend -- link to API calls in backend/app/main.py

export interface Course {
  course_id: string;
  name: string;
  color: string;
}

export async function getCourses(): Promise<Course[]> {
  try {
    const response = await fetch('http://127.0.0.1:5000/db/courses');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses: Course[] = await response.json();
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}
